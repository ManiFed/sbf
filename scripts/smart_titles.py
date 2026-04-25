import csv
import os
import re

INPUT = "source_index.csv"
OUTPUT = "source_index.csv"

FIELDNAMES = [
    "id",
    "title",
    "display_title",
    "date",
    "source_url",
    "folder",
    "type",
    "author",
    "reliability",
    "side",
    "notes",
]

def clean_extension(title):
    return re.sub(r"\.(pdf|txt|md|jpeg|jpg|png)$", "", title, flags=re.IGNORECASE)

def smart_title(title, folder):
    raw = clean_extension(title)
    lower = raw.lower()

    # CourtListener / PACER style filenames
    m = re.search(r"gov\.uscourts\.nysd\.590939\.(\d+)\.(\d+)", lower)
    if m:
        docket_num = m.group(1)
        attachment_num = m.group(2)
        if attachment_num == "0":
            return f"Court Filing {docket_num}"
        return f"Court Filing {docket_num}, Attachment {attachment_num}"

    # Clean common web-export junk
    cleaned = raw
    cleaned = cleaned.replace("_", " ")
    cleaned = cleaned.replace("-", " ")
    cleaned = cleaned.replace("  ", " ")
    cleaned = cleaned.strip()

    # Preserve recognizable names
    cleaned = cleaned.replace("Sbf", "SBF")
    cleaned = cleaned.replace("Ftx", "FTX")
    cleaned = cleaned.replace("Nav", "NAV")
    cleaned = cleaned.replace("Tos", "TOS")

    # Title-case unless it already looks like a headline
    if cleaned.islower() or cleaned.isupper():
        cleaned = cleaned.title()

    if folder == "legal" and not cleaned.lower().startswith("court"):
        return f"Legal Document: {cleaned}"

    if folder == "media":
        return f"Media: {cleaned}"

    if folder == "misc":
        return f"Misc: {cleaned}"

    return cleaned

with open(INPUT, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for row in rows:
    title = row.get("title", "")
    folder = row.get("folder", "")

    if not row.get("display_title"):
        row["display_title"] = smart_title(title, folder)

for row in rows:
    for field in FIELDNAMES:
        row.setdefault(field, "")

with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(rows)

print(f"Added smart display titles for {len(rows)} rows")
