import json
from scripts.ask import ask

def handler(request):
    try:
        body = json.loads(request.body or "{}")
        question = body.get("question", "")

        answer = ask(question)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"answer": answer}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
