from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json

from dotenv import load_dotenv


load_dotenv()

model = ChatGoogleGenerativeAI(model="gemini-flash-latest")

template = PromptTemplate(
    template = """You are a senior software engineer performing a professional GitHub Pull Request code review.
Your job is to analyze the given code diff and return
a structured JSON response ONLY. No extra text.
No markdown. No backticks. Just raw JSON.

Return this exact JSON format:
{{
"summary": "brief overall review summary",
"overall_score": 85,
"bugs": [
    {{
    "line": 10,
    "description": "bug description here",
    "severity": "high"
    }}
],
"improvements": [
    {{
    "line": 5,
    "description": "improvement suggestion here",
    "severity": "medium"
    }}
],
"security_issues": [
    {{
    "line": 3,
    "description": "security issue description",
    "severity": "high"
    }}
],
"positive_points": [
    "what developer did well"
]
}}

Severity levels: "high", "medium", "low"
Return JSON only. No markdown. No explanation.

Now review this Pull Request diff:

{sample_diff}""",
    input_variables=["sample_diff"]
)



# SAMPLE DIFF (fake PR diff for testing)

sample_diff = """
diff --git a/payment.py b/payment.py
index 83db48f..f735c80 100644
--- a/payment.py
+++ b/payment.py
@@ -1,15 +1,20 @@
 import sqlite3
+import os

 def get_user(username):
-    query = "SELECT * FROM users WHERE username = '" + username + "'"
+    query = "SELECT * FROM users WHERE username = ?"
     conn = sqlite3.connect('database.db')
     cursor = conn.cursor()
-    cursor.execute(query)
+    cursor.execute(query, (username,))
     return cursor.fetchone()

 def calculate_discount(price, discount):
-    result = price / discount
+    if discount == 0:
+        return price
+    result = price / discount
     return result

 def save_password(password):
-    db.save(password)
+    db.save(hash(password))
"""


parser = StrOutputParser()


def test_ai_review():
    print("🚀 Sending diff to Gemini for review...")
    print("-" * 50)

    chain = template | model | parser

    result = chain.invoke({"sample_diff": sample_diff})

    print(result)
    raw_response = result.strip()

   
    if raw_response.startswith("```"):
        raw_response = raw_response.split("```")[1]
        if raw_response.startswith("json"):
            raw_response = raw_response[4:]

    print("Raw Gemini Response:")
    print(raw_response)
    print("-" * 50)

 
    try:
        review = json.loads(raw_response)

        print("\n📊 REVIEW RESULTS:")
        print(f"Overall Score : {review['overall_score']}/100")
        print(f"Summary       : {review['summary']}")

        print(f"\n🐛 Bugs Found ({len(review['bugs'])}):")
        for bug in review['bugs']:
            print(f"  Line {bug['line']} [{bug['severity'].upper()}]: {bug['description']}")

        print(f"\n💡 Improvements ({len(review['improvements'])}):")
        for imp in review['improvements']:
            print(f"  Line {imp['line']} [{imp['severity'].upper()}]: {imp['description']}")

        print(f"\n🔐 Security Issues ({len(review['security_issues'])}):")
        for sec in review['security_issues']:
            print(f"  Line {sec['line']} [{sec['severity'].upper()}]: {sec['description']}")

        print(f"\n✅ Positive Points:")
        for point in review['positive_points']:
            print(f"  → {point}")

    except json.JSONDecodeError:
        print("❌ JSON parsing failed!")
        print("Raw response was:", raw_response)


if __name__ == "__main__":
    test_ai_review()