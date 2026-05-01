import os
import re
import requests
from scripts.search_chunks import search

SYSTEM_PROMPT = """
You are a defense-argument assistant for the Sam Bankman-Fried case.

Rules:
- Argue from a defense-oriented perspective.
- Don't naively believe something the prosecution says, actually look at the real data you have and investigate the claim.
- NEVER argue for the prosecution.
- Keep responses tight and useful: default to 2-4 sentences unless the user asks for depth.
- For complex or multi-part questions, reason through the evidence before concluding.
- Mention sources sparsely.
- Do not talk about "retrieved context", "provided context", or your internal process.
- Do not invent quotes, evidence, filings, or citations.
- If retrieved sources contain relevant information, use them and cite inline as [Source N](url). If the sources don't address the question, draw on your knowledge of the SBF case — but do not attach a source number to a claim unless that source actually supports it.
"""

REWRITE_SYSTEM = (
    "You convert user questions into concise search queries optimized for "
    "retrieving relevant passages from legal documents about the Sam Bankman-Fried trial. "
    "Output only the search query — one line, no explanation, no punctuation at the end."
)


def build_context(results):
    blocks = []
    for i, (score, text, chunk_id) in enumerate(results, start=1):
        github_url = chunk_id_to_github_url(chunk_id)
        blocks.append(
            f"[Source {i}: {chunk_id}, score={score:.3f}, github={github_url}]\n{text}"
        )
    return "\n\n".join(blocks)


def build_prompt(question, context):
    return f"""User question:
{question}

Retrieved context:
{context}

Answer the question using the retrieved context where relevant. Cite sources inline in markdown, like [Source 1](github-url).
Do not mention the words "retrieved context", "provided context", or similar framing in your answer.
"""


def build_prompt_no_sources(question):
    return f"""User question:
{question}

No documents were retrieved that closely match this question. Answer using your knowledge of the SBF case. Do not cite a source number.
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


def _build_messages(system, prompt, history=None):
    messages = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})
    return messages


def chat_completion(url, api_key, model, prompt, extra_headers=None, history=None, system=None):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    if extra_headers:
        headers.update(extra_headers)

    messages = _build_messages(system or SYSTEM_PROMPT, prompt, history)

    response = requests.post(
        url,
        headers=headers,
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.4,
        },
        timeout=120,
    )

    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def call_openrouter(prompt, history=None, system=None):
    return chat_completion(
        url="https://openrouter.ai/api/v1/chat/completions",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model="qwen/qwen3-32b",
        prompt=prompt,
        extra_headers={
            "HTTP-Referer": "https://sbf-data.vercel.app",
            "X-Title": "sbf-data",
        },
        history=history,
        system=system,
    )


def call_groq(prompt, history=None, system=None):
    return chat_completion(
        url="https://api.groq.com/openai/v1/chat/completions",
        api_key=os.getenv("GROQ_API_KEY"),
        model="qwen/qwen3-32b",
        prompt=prompt,
        history=history,
        system=system,
    )


def call_fireworks(prompt, history=None, system=None):
    return chat_completion(
        url="https://api.fireworks.ai/inference/v1/chat/completions",
        api_key=os.environ["FIREWORKS_API_KEY"],
        model=os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/qwen3-235b-a22b"),
        prompt=prompt,
        history=history,
        system=system,
    )


def call_github_models(prompt, history=None, system=None):
    return chat_completion(
        url="https://models.github.ai/inference/chat/completions",
        api_key=os.environ["GH_MODELS_TOKEN"],
        model=os.getenv("GH_MODELS_MODEL", "qwen/Qwen3-30B-A3B-Instruct-2507"),
        prompt=prompt,
        history=history,
        system=system,
    )


def call_huggingface(prompt, history=None, system=None):
    api_key = os.environ["HF_TOKEN"]
    model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")

    # HF inference API doesn't support chat format; flatten history into text
    full_prompt = system or SYSTEM_PROMPT
    if history:
        for msg in history:
            role = msg["role"].capitalize()
            full_prompt += f"\n\n{role}: {msg['content']}"
    full_prompt += f"\n\n{prompt}"

    response = requests.post(
        f"https://api-inference.huggingface.co/models/{model}",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "inputs": full_prompt,
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


def call_ollama_cloud(prompt, history=None, system=None):
    return chat_completion(
        url="https://ollama.com/api/chat",
        api_key=os.environ["OLLAMA_API_KEY"],
        model=os.getenv("OLLAMA_CLOUD_MODEL", "qwen2.5:7b"),
        prompt=prompt,
        history=history,
        system=system,
    )


def call_local_ollama(prompt, history=None, system=None):
    full_prompt = system or SYSTEM_PROMPT
    if history:
        for msg in history:
            role = msg["role"].capitalize()
            full_prompt += f"\n\n{role}: {msg['content']}"
    full_prompt += f"\n\n{prompt}"

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": os.getenv("LOCAL_OLLAMA_MODEL", "qwen2.5:7b"),
            "prompt": full_prompt,
            "stream": False,
        },
        timeout=180,
    )

    response.raise_for_status()
    return response.json()["response"]


def call_model(prompt, history=None, system=None):
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
            return fn(prompt, history=history, system=system), name
        except Exception as e:
            errors.append(f"{name}: {e}")

    raise RuntimeError("All providers failed:\n" + "\n".join(errors))


def rewrite_query(question):
    """Rewrite the user question into a search-optimized query."""
    try:
        rewritten, _ = call_model(question, system=REWRITE_SYSTEM)
        return rewritten.strip().splitlines()[0].strip()
    except Exception:
        return question


def ask(question, history=None):
    search_query = rewrite_query(question)
    results = search(search_query, top_k=8)

    if results:
        context = build_context(results)
        prompt = build_prompt(question, context)
        answer, provider = call_model(prompt, history=history)
        answer_with_links = render_clickable_citations(answer, results)
    else:
        prompt = build_prompt_no_sources(question)
        answer, provider = call_model(prompt, history=history)
        answer_with_links = answer

    return f"{answer_with_links}\n\nProvider used: {provider}"


if __name__ == "__main__":
    history = []

    while True:
        question = input("\nAsk: ").strip()

        if not question:
            break

        answer = ask(question, history=history)
        print("\n" + answer)

        # Keep last 6 turns (3 exchanges) as rolling context
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": answer})
        history = history[-6:]
