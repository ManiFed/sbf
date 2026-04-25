import os
import csv

ROOT = "."
OUTPUT = "source_index.csv"

folders = ["legal", "media", "misc"]

rows = []

for folder in folders:
    if not os.path.exists(folder):
        continue

    for dirpath, _, filenames in os.walk(folder):
        for filename in filenames:
            path = os.path.join(dirpath, filename)

            rows.append({
                "id": path.replace("/", "_").replace(".", "_"),
                "title": filename,
                "date": "",
                "source_url": "",
                "folder": folder,
                "type": "",
                "author": "",
                "reliability": "",
                "side": "",
                "notes": ""
            })

with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
    fieldnames = [
        "id",
        "title",
        "date",
        "source_url",
        "folder",
        "type",
        "author",
        "reliability",
        "side",
        "notes",
    ]

    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Wrote {len(rows)} rows to {OUTPUT}")
