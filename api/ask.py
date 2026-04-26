import json
from scripts.ask import ask

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "Method not allowed"})
        }

    try:
        body = json.loads(request.body)
        question = body.get("question", "")

        answer = ask(question)

        return {
            "statusCode": 200,
            "body": json.dumps({"answer": answer}),
            "headers": {"Content-Type": "application/json"}
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
