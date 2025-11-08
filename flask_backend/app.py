from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from textblob import TextBlob
import hashlib

app = Flask(__name__)
CORS(app)

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="nulltrace",
    user="postgres",
    password="YOUR_PASSWORD",  # change this
    host="localhost"
)
cursor = conn.cursor()


# ===========================
# User Registration
# ===========================
@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()

    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_pw))
        conn.commit()
        return jsonify({"success": True, "message": "User registered successfully"})
    except psycopg2.Error as e:
        conn.rollback()
        if "unique" in str(e).lower():
            return jsonify({"error": "Username already exists"}), 409
        return jsonify({"error": "Database error"}), 500


# ===========================
# User Login
# ===========================
@app.route("/api/login", methods=["POST"])
def login_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()

    cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, hashed_pw))
    user = cursor.fetchone()

    if user:
        return jsonify({"success": True, "username": username})
    else:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401


# ===========================
# Feedback Submission
# ===========================
@app.route("/api/feedback", methods=["POST"])
def handle_feedback():
    data = request.json
    message = data.get("message")
    email = data.get("email")

    if not message or not email:
        return jsonify({"error": "Missing email or message"}), 400

    blob = TextBlob(message)
    polarity = blob.sentiment.polarity

    if polarity > 0.3:
        sentiment, rating = "positive", 5
    elif polarity < -0.3:
        sentiment, rating = "negative", 1
    else:
        sentiment, rating = "neutral", 3

    feedback_hash = hashlib.sha256(message.encode()).hexdigest()

    try:
        cursor.execute(
            "INSERT INTO feedback (user_email, message, sentiment, rating, hash) VALUES (%s, %s, %s, %s, %s)",
            (email, message, sentiment, rating, feedback_hash)
        )
        conn.commit()
        return jsonify({
            "sentiment": sentiment,
            "rating": rating,
            "hash": feedback_hash
        })
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": "Database error"}), 500


# ===========================
# Fetch All Feedback (optional)
# ===========================
@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    cursor.execute("SELECT * FROM feedback ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "email": row[1],
            "message": row[2],
            "sentiment": row[3],
            "rating": row[4],
            "hash": row[5],
            "created_at": row[6].isoformat()
        })
    return jsonify(results)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
