import os
from pathlib import Path
import json
import re

INPUT_DIR = Path("processed/text")
OUTPUT_DIR = Path("processed/chunks")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 400  # words
OVERLAP = 100

def split_paragraphs(text):
    # Split on blank lines or page markers, keeping non-empty blocks
    blocks = re.split(r"\n{2,}|(?=--- PAGE \d+ ---)", text)
    return [b.strip() for b in blocks if b.strip()]

def chunk_text(text):
    paragraphs = split_paragraphs(text)
    chunks = []
    current_words = []

    for para in paragraphs:
        para_words = para.split()

        # If adding this paragraph would overflow the chunk, flush first
        if current_words and len(current_words) + len(para_words) > CHUNK_SIZE:
            chunks.append(" ".join(current_words))
            # Carry over the overlap tail
            current_words = current_words[-OVERLAP:]

        current_words.extend(para_words)

        # If the buffer is already over the chunk size, keep slicing
        while len(current_words) > CHUNK_SIZE:
            chunks.append(" ".join(current_words[:CHUNK_SIZE]))
            current_words = current_words[CHUNK_SIZE - OVERLAP:]

    if current_words:
        chunks.append(" ".join(current_words))

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
