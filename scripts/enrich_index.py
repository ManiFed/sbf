import csv
import re

INPUT = "source_index.csv"
OUTPUT = "source_index.csv"

def guess_type(title, folder):
    t = title.lower()

    if folder == "legal":
        return "court filing"
    if "substack" in t:
        return "public statement"
    if "abc news" in t or "washington post" in t or "new york sun" in t or "puck" in t:
        return "media article"
    if "graph" in t or t.endswith(".jpeg") or t.endswith(".jpg") or t.endswith(".png"):
        return "image"
    if "tos" in t or "terms" in t:
        return "terms of service"
    if "trial" in t:
        return "trial material"

    return "unknown"

def guess_side(title, folder):
    t = title.lower()

    if "defense" in t or "free sbf" in t or "sbf’s substack" in t or "sbf's substack" in t:
        return "defense"
    if "gov.uscourts" in t:
        return "court"
    if "opinion" in t or "abc news" in t or "washington post" in t or "puck" in t:
        return "media"
    if "caroline" in t or "ellison" in t:
        return "mixed"

    return "unknown"

def guess_reliability(folder, doc_type):
    if folder == "legal":
        return "high"
    if doc_type == "public statement":
        return "primary but self-interested"
    if doc_type == "media article":
        return "secondary"
    if doc_type == "image":
        return "needs verification"

    return "unknown"

def guess_date(title):
    patterns = [
        r"(20\d{2})[-_.](\d{2})[-_.](\d{2})",
        r"(\d{1,2})[._-](\d{1,2})[._-](20\d{2})",
    ]

    for pattern in patterns:
        m = re.search(pattern, title)
        if m:
            parts = m.groups()
            if len(parts[0]) == 4:
                return f"{parts[0]}-{parts[1]}-{parts[2]}"
            return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"

    return ""

with open(INPUT, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for row in rows:
    title = row.get("title", "")
    folder = row.get("folder", "")

    guessed_type = guess_type(title, folder)

    row["type"] = row.get("type") or guessed_type
    row["side"] = row.get("side") or guess_side(title, folder)
    row["reliability"] = row.get("reliability") or guess_reliability(folder, guessed_type)
    row["date"] = row.get("date") or guess_date(title)

    if not row.get("notes"):
        row["notes"] = "auto-enriched from filename/folder"

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

with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Enriched {len(rows)} rows")
