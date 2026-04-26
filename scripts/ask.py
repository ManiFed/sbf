import os
import re
import requests
from scripts.search_chunks import search

SYSTEM_PROMPT = """
You are a transparent defense-argument assistant for the Sam Bankman-Fried case.

Rules:
- Do not pretend to be Sam Bankman-Fried.
- Argue from a defense-oriented perspective.
- Separate facts, allegations, defense arguments, and uncertainty.
- Do not invent quotes, evidence, filings, or citations.
- Use only the provided retrieved context for factual claims.
- If the context is insufficient, say what is missing.
"""

def build_context(results):
    blocks = []
    for i, (score, text, chunk_id) in enumerate(results, start=1):
        github_url = chunk_id_to_github_url(chunk_id)
        blocks.append(
            f"[Source {i}: {chunk_id}, score={score}, github={github_url}]\n{text}"
        )
    return "\n\n".join(blocks)

def build_prompt(question, context):
    return f"""
User question:
{question}

Retrieved context:
{context}

Answer using only the retrieved context. Cite sources inline in markdown, like [Source 1](github-url).
"""


def chunk_id_to_repo_path(chunk_id):
    base = re.sub(r"_\d+$", "", chunk_id)

    if "__" in base:
        folder, filename = base.split("__", 1)
        return f"{folder}/{filename}"

    return base


def chunk_id_to_github_url(chunk_id):
    repo = os.getenv("GITHUB_REPOSITORY", "").strip()

    if not repo:
        return chunk_id_to_repo_path(chunk_id)

    branch = os.getenv("GITHUB_BRANCH", "main").strip() or "main"
    path = chunk_id_to_repo_path(chunk_id)
    return f"https://github.com/{repo}/blob/{branch}/{path}"


def build_source_links(results):
    lines = ["Sources:"]

    for i, (_, _, chunk_id) in enumerate(results, start=1):
        url = chunk_id_to_github_url(chunk_id)
        lines.append(f"- [Source {i}]({url})")

    return "\n".join(lines)


def render_clickable_citations(answer, results):
    source_urls = {
        str(i): chunk_id_to_github_url(chunk_id)
        for i, (_, _, chunk_id) in enumerate(results, start=1)
    }

    def repl(match):
        idx = match.group(1)
        url = source_urls.get(idx)
        if not url:
            return match.group(0)
        return f"[Source {idx}]({url})"

    answer = re.sub(r"(?<!\]\()\[Source\s+(\d+)\]", repl, answer)
    return f"{answer}\n\n{build_source_links(results)}"

def chat_completion(url, api_key, model, prompt, extra_headers=None):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    if extra_headers:
        headers.update(extra_headers)

    response = requests.post(
        url,
        headers=headers,
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        },
        timeout=120,
    )

    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def call_openrouter(prompt):
    return chat_completion(
        url="https://openrouter.ai/api/v1/chat/completions",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model="qwen/qwen3-32b",
        prompt=prompt,
        extra_headers={
            "HTTP-Referer": "https://sbf-data.vercel.app",
            "X-Title": "sbf-data",
        },
    )

def call_groq(prompt):
    return chat_completion(
        url="https://api.groq.com/openai/v1/chat/completions",
        api_key=os.getenv("GROQ_API_KEY"),
        model="qwen/qwen3-32b",
        prompt=prompt,
    )

def call_fireworks(prompt):
    return chat_completion(
        url="https://api.fireworks.ai/inference/v1/chat/completions",
        api_key=os.environ["FIREWORKS_API_KEY"],
        model=os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/qwen3-235b-a22b"),
        prompt=prompt,
    )

def call_github_models(prompt):
    return chat_completion(
        url="https://models.github.ai/inference/chat/completions",
        api_key=os.environ["GH_MODELS_TOKEN"],
        model=os.getenv("GH_MODELS_MODEL", "qwen/Qwen3-30B-A3B-Instruct-2507"),
        prompt=prompt,
    )

def call_huggingface(prompt):
    api_key = os.environ["HF_TOKEN"]
    model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")

    response = requests.post(
        f"https://api-inference.huggingface.co/models/{model}",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "inputs": f"{SYSTEM_PROMPT}\n\n{prompt}",
            "parameters": {
                "max_new_tokens": 800,
                "temperature": 0.4,
                "return_full_text": False,
            },
        },
        timeout=180,
    )

    response.raise_for_status()
    data = response.json()

    if isinstance(data, list) and data:
        return data[0].get("generated_text", str(data))

    return str(data)

def call_ollama_cloud(prompt):
    return chat_completion(
        url="https://ollama.com/api/chat",
        api_key=os.environ["OLLAMA_API_KEY"],
        model=os.getenv("OLLAMA_CLOUD_MODEL", "qwen2.5:7b"),
        prompt=prompt,
    )

def call_local_ollama(prompt):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": os.getenv("LOCAL_OLLAMA_MODEL", "qwen2.5:7b"),
            "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
            "stream": False,
        },
        timeout=180,
    )

    response.raise_for_status()
    return response.json()["response"]

def call_model(prompt):
    providers = [
        ("OpenRouter", "OPENROUTER_API_KEY", call_openrouter),
        ("Groq", "GROQ_API_KEY", call_groq),
        ("Fireworks", "FIREWORKS_API_KEY", call_fireworks),
        ("GitHub Models", "GH_MODELS_TOKEN", call_github_models),
        ("Hugging Face", "HF_TOKEN", call_huggingface),
        ("Ollama Cloud", "OLLAMA_API_KEY", call_ollama_cloud),
        ("Local Ollama", None, call_local_ollama),
    ]

    errors = []

    for name, required_key, fn in providers:
        if required_key and not os.getenv(required_key):
            errors.append(f"{name}: missing {required_key}")
            continue

        try:
            return fn(prompt), name
        except Exception as e:
            errors.append(f"{name}: {e}")

    raise RuntimeError("All providers failed:\n" + "\n".join(errors))

def ask(question):
    results = search(question, top_k=8)

    if not results:
        return "I could not find relevant chunks in the dataset yet."

    context = build_context(results)
    prompt = build_prompt(question, context)

    answer, provider = call_model(prompt)
    answer_with_links = render_clickable_citations(answer, results)
    return f"{answer_with_links}\n\nProvider used: {provider}"

if __name__ == "__main__":
    while True:
        question = input("\nAsk: ").strip()

        if not question:
            break

        print("\n" + ask(question))
