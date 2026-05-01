import json
import numpy as np
from pathlib import Path
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder

BASE_DIR = Path(__file__).resolve().parent.parent
CHUNK_DIR = BASE_DIR / "processed" / "chunks"
EMBED_INDEX_PATH = BASE_DIR / "processed" / "embed_index.npy"
EMBED_META_PATH = BASE_DIR / "processed" / "embed_meta.json"

EMBED_MODEL = "all-MiniLM-L6-v2"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
MIN_SCORE = 0.5
RRF_K = 60
CANDIDATE_K = 20  # retrieve this many before reranking

_bm25_index = None
_embed_index = None
_embedder = None
_reranker = None


def _build_bm25():
    global _bm25_index
    corpus, chunk_ids, texts = [], [], []

    for path in sorted(CHUNK_DIR.rglob("*.json")):
        for item in json.loads(path.read_text(encoding="utf-8")):
            corpus.append(item["text"].lower().split())
            chunk_ids.append(item["chunk_id"])
            texts.append(item["text"])

    _bm25_index = (BM25Okapi(corpus), chunk_ids, texts)


def _load_embed_index():
    global _embed_index
    if not EMBED_INDEX_PATH.exists():
        return False

    vectors = np.load(str(EMBED_INDEX_PATH))
    meta = json.loads(EMBED_META_PATH.read_text(encoding="utf-8"))
    chunk_ids = [m["chunk_id"] for m in meta]
    texts = [m["text"] for m in meta]
    _embed_index = (vectors, chunk_ids, texts)
    return True


def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL)
    return _embedder


def _get_reranker():
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(RERANK_MODEL)
    return _reranker


def _bm25_search(query, top_k):
    global _bm25_index
    if _bm25_index is None:
        _build_bm25()

    bm25, chunk_ids, texts = _bm25_index
    scores = bm25.get_scores(query.lower().split())
    ranked = sorted(zip(scores, chunk_ids, texts), key=lambda x: x[0], reverse=True)
    return ranked[:top_k]


def _semantic_search(query, top_k):
    if not _load_embed_index() if _embed_index is None else False:
        return []

    vectors, chunk_ids, texts = _embed_index
    embedder = _get_embedder()
    q_vec = embedder.encode([query], normalize_embeddings=True)[0]
    sims = vectors @ q_vec
    ranked_idx = np.argsort(sims)[::-1][:top_k]
    return [(float(sims[i]), chunk_ids[i], texts[i]) for i in ranked_idx]


def _rrf_merge(bm25_ranked, sem_ranked):
    scores = {}
    texts_map = {}

    for rank, (_, cid, text) in enumerate(bm25_ranked):
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (RRF_K + rank + 1)
        texts_map[cid] = text

    for rank, (_, cid, text) in enumerate(sem_ranked):
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (RRF_K + rank + 1)
        texts_map[cid] = text

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, cid, texts_map[cid]) for cid, score in ranked]


def search(query, top_k=5):
    bm25_results = _bm25_search(query, CANDIDATE_K)

    # Try hybrid; fall back gracefully to BM25-only if embed index missing
    global _embed_index
    if _embed_index is None:
        _load_embed_index()

    if _embed_index is not None:
        sem_results = _semantic_search(query, CANDIDATE_K)
        candidates = _rrf_merge(bm25_results, sem_results)
    else:
        candidates = [(s, c, t) for s, c, t in bm25_results]

    if not candidates:
        return []

    # Cross-encoder reranking over the merged candidates
    reranker = _get_reranker()
    pairs = [(query, text) for _, _, text in candidates]
    rerank_scores = reranker.predict(pairs)

    reranked = sorted(
        zip(rerank_scores, [c for _, c, _ in candidates], [t for _, _, t in candidates]),
        key=lambda x: x[0],
        reverse=True,
    )

    results = [(s, t, c) for s, c, t in reranked[:top_k] if s >= MIN_SCORE]
    return results


if __name__ == "__main__":
    while True:
        query = input("\nQuery: ")

        if not query:
            break

        results = search(query)

        if not results:
            print("No results above score threshold.")
            continue

        print("\nTop results:\n")

        for score, text, cid in results:
            print(f"[Score: {score:.3f}] {cid}\n{text[:500]}\n{'-'*60}")
