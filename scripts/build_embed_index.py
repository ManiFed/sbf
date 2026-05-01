"""
Build (or rebuild) the semantic embedding index over all processed chunks.
Outputs:
  processed/embed_index.npy   — float32 array of shape [N, dim]
  processed/embed_meta.json   — list of {chunk_id, text} in the same row order
Run: python scripts/build_embed_index.py
"""

import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

CHUNK_DIR = Path("processed/chunks")
OUT_DIR = Path("processed")
EMBED_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 64


def main():
    model = SentenceTransformer(EMBED_MODEL)

    chunk_ids = []
    texts = []

    for path in sorted(CHUNK_DIR.rglob("*.json")):
        for item in json.loads(path.read_text(encoding="utf-8")):
            chunk_ids.append(item["chunk_id"])
            texts.append(item["text"])

    print(f"Encoding {len(texts)} chunks...")
    embeddings = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )

    np.save(OUT_DIR / "embed_index.npy", embeddings.astype(np.float32))

    meta = [{"chunk_id": c, "text": t} for c, t in zip(chunk_ids, texts)]
    (OUT_DIR / "embed_meta.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )

    print(f"Saved {len(texts)} embeddings → processed/embed_index.npy + embed_meta.json")


if __name__ == "__main__":
    main()
