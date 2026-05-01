import json
from pathlib import Path
from rank_bm25 import BM25Okapi

BASE_DIR = Path(__file__).resolve().parent.parent
CHUNK_DIR = BASE_DIR / "processed" / "chunks"

MIN_SCORE = 0.5

_index = None

def _build_index():
    global _index
    corpus = []
    chunk_ids = []
    texts = []

    for path in sorted(CHUNK_DIR.rglob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in data:
            tokens = item["text"].lower().split()
            corpus.append(tokens)
            chunk_ids.append(item["chunk_id"])
            texts.append(item["text"])

    _index = (BM25Okapi(corpus), chunk_ids, texts)


def search(query, top_k=5):
    global _index
    if _index is None:
        _build_index()

    bm25, chunk_ids, texts = _index
    query_terms = query.lower().split()
    scores = bm25.get_scores(query_terms)

    ranked = sorted(
        zip(scores, texts, chunk_ids),
        key=lambda x: x[0],
        reverse=True,
    )

    results = [(s, t, c) for s, t, c in ranked[:top_k] if s >= MIN_SCORE]
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
            print(f"[Score: {score:.2f}] {cid}\n{text[:500]}\n{'-'*60}")
