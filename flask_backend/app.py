from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import uuid
import hashlib
import json
from datetime import datetime
from textblob import TextBlob

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ======================
# HANDLE PREFLIGHT
# ======================
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response


# ======================
# DATABASE CONNECTION
# ======================
conn = psycopg2.connect(
    dbname="nulltrace",
    user="postgres",
    password="YOUR_PASSWORD",  # change this
    host="localhost"
)
cursor = conn.cursor()


# ======================
# PASSWORD HASH
# ======================
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


# ======================
# USER REGISTER
# ======================
@app.route("/api/register", methods=["POST", "OPTIONS"])
def register_user():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_pw = hash_password(password)
    user_id = str(uuid.uuid4())

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT")
        conn.commit()

        cursor.execute(
            "INSERT INTO users (user_id, name, password) VALUES (%s, %s, %s)",
            (user_id, username, hashed_pw),
        )
        conn.commit()
        return jsonify({"success": True, "user_id": user_id, "name": username})
    except psycopg2.Error as e:
        conn.rollback()
        if "unique" in str(e).lower():
            return jsonify({"error": "Username already exists"}), 409
        return jsonify({"error": str(e)}), 500


# ======================
# USER LOGIN
# ======================
@app.route("/api/login", methods=["POST", "OPTIONS"])
def login_user():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    username = data.get("name") or data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_pw = hash_password(password)
    cursor.execute(
        "SELECT user_id, name FROM users WHERE name = %s AND password = %s",
        (username, hashed_pw),
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    user_id, name = user
    return jsonify({"success": True, "user_id": user_id, "name": name})


# ======================
# PRIVATE FEEDBACK
# ======================
@app.route("/api/feedback", methods=["POST", "OPTIONS"])
def submit_feedback():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    submitted_by = data.get("submitted_by")
    content = data.get("content")

    if not submitted_by or not content:
        return jsonify({"error": "Missing submitted_by or content"}), 400

    response_id = str(uuid.uuid4())
    submitted_at = datetime.now()

    try:
        cursor.execute(
            "INSERT INTO feedback_responses (response_id, form_id, submitted_by, submitted_at) VALUES (%s, %s, %s, %s)",
            (
                response_id,
                "94277f20-fc37-4038-930c-404a87591f64",  # fixed form ID
                submitted_by,
                submitted_at,
            ),
        )
        cursor.execute(
            "INSERT INTO response_answers (answer_id, response_id, question_id, answer_text) VALUES (%s, %s, %s, %s)",
            (
                str(uuid.uuid4()),
                response_id,
                "52c8ad19-6b68-4d39-8456-7c3638f7eb04",  # fixed question ID
                content,
            ),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Feedback submitted successfully"})
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# ======================
# PUBLIC OPINIONS (with sentiment)
# ======================
@app.route("/api/opinions", methods=["POST", "OPTIONS"])
def post_opinion():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    submitted_by = data.get("submitted_by")
    content = data.get("content")

    if not content:
        return jsonify({"error": "Missing content"}), 400

    blob = TextBlob(content)
    polarity = blob.sentiment.polarity

    if polarity > 0.3:
        sentiment = "positive"
        rating = 5
    elif polarity < -0.3:
        sentiment = "negative"
        rating = 1
    else:
        sentiment = "neutral"
        rating = 3

    opinion_id = str(uuid.uuid4())
    submitted_at = datetime.now()

    try:
        # Insert opinion
        cursor.execute(
            "INSERT INTO opinions (opinion_id, submitted_by, content, submitted_at) VALUES (%s, %s, %s, %s)",
            (opinion_id, submitted_by, content, submitted_at),
        )
        conn.commit()

        # Get engine or dummy
        cursor.execute("SELECT engine_id FROM engines LIMIT 1;")
        engine = cursor.fetchone()
        engine_id = engine[0] if engine else str(uuid.uuid4())

        # Insert analytics record
        cursor.execute(
            "INSERT INTO analytics (analytics_id, result, engine_id, opinion_id, analyzed_at) VALUES (%s, %s, %s, %s, %s)",
            (
                str(uuid.uuid4()),
                json.dumps({"sentiment": sentiment, "rating": rating}),
                engine_id,
                opinion_id,
                datetime.now(),
            ),
        )
        conn.commit()

        return jsonify({
            "opinion_id": opinion_id,
            "sentiment": sentiment,
            "rating": rating,
        })
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# ======================
# GET OPINIONS
# ======================
@app.route("/api/opinions", methods=["GET"])
def get_opinions():
    try:
        cursor.execute(
            "SELECT opinion_id, submitted_by, content, submitted_at FROM opinions ORDER BY submitted_at DESC"
        )
        rows = cursor.fetchall()
        output = []

        for r in rows:
            opinion_id, submitted_by, content, submitted_at = r
            cursor.execute(
                "SELECT result FROM analytics WHERE opinion_id = %s",
                (opinion_id,),
            )
            analytics = cursor.fetchone()

            sentiment = rating = None
            if analytics and analytics[0]:
                data = analytics[0]
                # Handle both TEXT and JSONB
                if isinstance(data, str):
                    try:
                        result = json.loads(data)
                    except Exception:
                        result = None
                elif isinstance(data, dict):
                    result = data
                else:
                    result = None

                if result:
                    sentiment = result.get("sentiment")
                    rating = result.get("rating")

            output.append({
                "id": opinion_id,
                "author": submitted_by,
                "content": content,
                "timestamp": submitted_at.isoformat(),
                "sentiment": sentiment,
                "rating": rating,
            })

        return jsonify(output)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500


# ======================
# RUN SERVER
# ======================
if __name__ == "__main__":
    app.run(port=5000, debug=True)
