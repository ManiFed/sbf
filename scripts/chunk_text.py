import os
from pathlib import Path
import json

INPUT_DIR = Path("processed/text")
OUTPUT_DIR = Path("processed/chunks")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 800  # words
OVERLAP = 100

def chunk_text(text):
    words = text.split()
    chunks = []

    i = 0
    while i < len(words):
        chunk_words = words[i:i + CHUNK_SIZE]
        chunk = " ".join(chunk_words)
        chunks.append(chunk)
        i += CHUNK_SIZE - OVERLAP

    return chunks

count = 0

for path in INPUT_DIR.rglob("*.txt"):
    text = path.read_text(encoding="utf-8", errors="ignore")

    chunks = chunk_text(text)

    base_name = path.stem
    out_path = OUTPUT_DIR / f"{base_name}.json"

    data = []

    for i, chunk in enumerate(chunks):
        data.append({
            "chunk_id": f"{base_name}_{i}",
            "text": chunk
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    count += 1

print(f"Chunked {count} documents")
