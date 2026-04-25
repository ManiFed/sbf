import os
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit("Missing dependency: pypdf")

SOURCE_FOLDERS = ["legal", "media", "misc"]
OUTPUT_DIR = Path("processed/text")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def safe_name(path):
    return str(path).replace("/", "__").replace(" ", "_") + ".txt"

count = 0
failed = 0

for folder in SOURCE_FOLDERS:
    if not os.path.exists(folder):
        continue

    for path in Path(folder).rglob("*.pdf"):
        output_path = OUTPUT_DIR / safe_name(path)

        try:
            reader = PdfReader(str(path))
            pages = []

            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append(f"\n\n--- PAGE {i + 1} ---\n\n{text}")

            output_path.write_text("\n".join(pages), encoding="utf-8")
            count += 1

        except Exception as e:
            failed += 1
            output_path.write_text(
                f"FAILED TO EXTRACT TEXT\nFile: {path}\nError: {e}\n",
                encoding="utf-8"
            )

print(f"Extracted text from {count} PDFs")
print(f"Failed on {failed} PDFs")
