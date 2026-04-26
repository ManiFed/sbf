import json
from pathlib import Path

CHUNK_DIR = Path("processed/chunks")

def search(query, top_k=5):
    results = []

    query_terms = query.lower().split()

    for path in CHUNK_DIR.rglob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))

        for item in data:
            text = item["text"].lower()

            score = sum(text.count(term) for term in query_terms)

            if score > 0:
                results.append((score, item["text"], item["chunk_id"]))

    results.sort(reverse=True, key=lambda x: x[0])

    return results[:top_k]


if __name__ == "__main__":
    while True:
        query = input("\nQuery: ")

        if not query:
            break

        results = search(query)

        print("\nTop results:\n")

        for score, text, cid in results:
            print(f"[Score: {score}] {cid}\n{text[:500]}\n{'-'*60}")
