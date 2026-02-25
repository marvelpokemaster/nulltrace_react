from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import uuid
import hashlib
import json
from datetime import datetime
from textblob import TextBlob
from blockchain import Blockchain
import os

blockchain = Blockchain()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_conn():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "nulltrace"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        host=os.getenv("DB_HOST", "localhost"),
    )

with get_conn() as conn:
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;")

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

ADMIN_USERNAME = "admin"

@app.before_request
def restrict_admin_routes():
    if request.method == "OPTIONS":
        return None
    if request.path.startswith("/api/admin"):
        data = request.get_json(silent=True) or {}
        username = data.get("username") or request.args.get("username") or request.headers.get("X-Username")
        if username is None:
            return jsonify({"error": "Missing username"}), 403
        if username.lower() != ADMIN_USERNAME:
            return jsonify({"error": "Unauthorized"}), 403

@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    role = "admin" if username.lower() == "admin" else "user"
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (user_id, name, password, role) VALUES (%s, %s, %s, %s);",
                    (user_id, username, hashed_pw, role),
                )
        return jsonify({"success": True, "user_id": user_id, "name": username, "role": role})
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login_user():
    data = request.json or {}
    username = data.get("username") or data.get("name")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    hashed_pw = hash_password(password)
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT user_id, name, role FROM users WHERE name = %s AND password = %s;",
                    (username, hashed_pw),
                )
                user = cur.fetchone()
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        return jsonify({"success": True, "user_id": user[0], "name": user[1], "role": user[2]})
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/targets", methods=["GET", "POST"])
def targets():
    if request.method == "GET":
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT target_id, name, category, created_at FROM opinion_targets ORDER BY name;")
                    rows = cur.fetchall()
            return jsonify([{"target_id": r[0], "name": r[1], "category": r[2], "created_at": r[3].isoformat()} for r in rows])
        except psycopg2.Error as e:
            return jsonify({"error": str(e)}), 500
    data = request.json or {}
    name = data.get("name")
    category = data.get("category")
    if not name:
        return jsonify({"error": "Missing name"}), 400
    try:
        target_id = str(uuid.uuid4())
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO opinion_targets (target_id, name, category) VALUES (%s, %s, %s);",
                    (target_id, name, category),
                )
        return jsonify({"success": True, "target_id": target_id})
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/opinions", methods=["GET", "POST"])
def opinions():
    if request.method == "POST":
        data = request.json or {}
        submitted_by = data.get("submitted_by")
        target_id = data.get("target_id")
        content = data.get("content")
        if not target_id or not content:
            return jsonify({"error": "Missing target_id or content"}), 400
        blob = TextBlob(content)
        polarity = blob.sentiment.polarity
        sentiment, rating = "neutral", 3
        if polarity > 0.3:
            sentiment, rating = "positive", 5
        elif polarity < -0.3:
            sentiment, rating = "negative", 1
        opinion_id = str(uuid.uuid4())
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    if submitted_by:
                        cur.execute("SELECT 1 FROM users WHERE user_id = %s;", (submitted_by,))
                        if cur.fetchone() is None:
                            cur.execute("INSERT INTO users (user_id, name) VALUES (%s, %s);", (submitted_by, "AutoUser"))
                    cur.execute("SELECT 1 FROM opinion_targets WHERE target_id = %s;", (target_id,))
                    if cur.fetchone() is None:
                        return jsonify({"error": f"Invalid target_id: {target_id}"}), 400
                    cur.execute("SELECT engine_id FROM engines LIMIT 1;")
                    engine = cur.fetchone()
                    if not engine:
                        engine_id = str(uuid.uuid4())
                        cur.execute("INSERT INTO engines (engine_id, name, version) VALUES (%s, %s, %s);", (engine_id, "DefaultEngine", "1.0"))
                    else:
                        engine_id = engine[0]
                    cur.execute(
                        "INSERT INTO opinions (opinion_id, submitted_by, target_id, content) VALUES (%s, %s, %s, %s);",
                        (opinion_id, submitted_by, target_id, content),
                    )
                    cur.execute(
                        "INSERT INTO analytics (analytics_id, result, engine_id, opinion_id, analyzed_at) VALUES (%s, %s, %s, %s, %s);",
                        (str(uuid.uuid4()), json.dumps({"sentiment": sentiment, "rating": rating}), engine_id, opinion_id, datetime.now()),
                    )
            blockchain.add_block({
                "type": "opinion",
                "opinion_id": opinion_id,
                "sentiment": sentiment,
                "rating": rating,
                "content": content,
                "timestamp": datetime.now().isoformat()
            })
            return jsonify({"opinion_id": opinion_id, "sentiment": sentiment, "rating": rating})
        except psycopg2.Error as e:
            return jsonify({"error": str(e)}), 500
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT o.opinion_id, o.submitted_by, o.content, o.submitted_at,
                           t.name, t.category, a.result
                    FROM opinions o
                    LEFT JOIN opinion_targets t ON o.target_id = t.target_id
                    LEFT JOIN analytics a ON o.opinion_id = a.opinion_id
                    ORDER BY o.submitted_at DESC;
                """)
                rows = cur.fetchall()
        out = []
        for r in rows:
            sentiment = rating = None
            if r[6]:
                try:
                    parsed = r[6] if isinstance(r[6], dict) else json.loads(r[6])
                    sentiment = parsed.get("sentiment")
                    rating = parsed.get("rating")
                except Exception:
                    pass
            out.append({
                "id": r[0],
                "author": r[1],
                "content": r[2],
                "timestamp": r[3].isoformat(),
                "target": r[4],
                "category": r[5],
                "sentiment": sentiment,
                "rating": rating
            })
        return jsonify(out)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.json or {}
    submitted_by = data.get("submitted_by")
    content = data.get("content")
    if not submitted_by or not content:
        return jsonify({"error": "Missing submitted_by or content"}), 400

    # 🔹 Use TextBlob to infer sentiment & rating
    blob = TextBlob(content)
    polarity = blob.sentiment.polarity
    sentiment, rating = "neutral", 3
    if polarity > 0.3:
        sentiment, rating = "positive", 5
    elif polarity < -0.3:
        sentiment, rating = "negative", 1

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Ensure user exists
                cur.execute("SELECT 1 FROM users WHERE user_id = %s;", (submitted_by,))
                if cur.fetchone() is None:
                    cur.execute(
                        "INSERT INTO users (user_id, name) VALUES (%s, %s);",
                        (submitted_by, "AutoUser"),
                    )

                # Ensure feedback form exists
                cur.execute("SELECT form_id FROM feedback_forms LIMIT 1;")
                form = cur.fetchone()
                if not form:
                    form_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO feedback_forms (form_id, created_by, title) VALUES (%s, %s, %s);",
                        (form_id, submitted_by, "Default Feedback Form"),
                    )
                else:
                    form_id = form[0]

                # Create feedback response
                response_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO feedback_responses (response_id, form_id, submitted_by, submitted_at) VALUES (%s, %s, %s, %s);",
                    (response_id, form_id, submitted_by, datetime.now()),
                )

                # Ensure question exists
                cur.execute("SELECT question_id FROM questions LIMIT 1;")
                question = cur.fetchone()
                if not question:
                    question_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO questions (question_id, form_id, question_text) VALUES (%s, %s, %s);",
                        (question_id, form_id, "What is your feedback?"),
                    )
                else:
                    question_id = question[0]

                # Store feedback text
                cur.execute(
                    "INSERT INTO response_answers (answer_id, response_id, question_id, answer_text) VALUES (%s, %s, %s, %s);",
                    (str(uuid.uuid4()), response_id, question_id, content),
                )

                # Ensure engine exists
                cur.execute("SELECT engine_id FROM engines LIMIT 1;")
                engine = cur.fetchone()
                if not engine:
                    engine_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO engines (engine_id, name, version) VALUES (%s, %s, %s);",
                        (engine_id, "FeedbackEngine", "1.0"),
                    )
                else:
                    engine_id = engine[0]

                # 🔹 Insert analytics (AI rating + sentiment)
                cur.execute(
                    "INSERT INTO analytics (analytics_id, result, engine_id, feedback_id, analyzed_at) VALUES (%s, %s, %s, %s, %s);",
                    (
                        str(uuid.uuid4()),
                        json.dumps({
                            "type": "feedback",
                            "sentiment": sentiment,
                            "rating": rating
                        }),
                        engine_id,
                        response_id,
                        datetime.now(),
                    ),
                )

        # Add to blockchain for immutability
        blockchain.add_block({
            "type": "feedback",
            "feedback_id": response_id,
            "sentiment": sentiment,
            "rating": rating,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        return jsonify({
            "success": True,
            "message": "Feedback recorded successfully!",
            "rating": rating,
            "sentiment": sentiment
        })
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/overview", methods=["GET"])
def admin_overview():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM users;")
                users = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM opinions;")
                opinions = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM feedback_responses;")
                feedbacks = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM opinion_targets;")
                targets = cur.fetchone()[0]
        return jsonify({"users": users, "opinions": opinions, "feedbacks": feedbacks, "targets": targets})
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/opinions", methods=["GET"])
def admin_all_opinions():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT o.opinion_id, u.name, t.name, o.content, o.submitted_at, a.result
                    FROM opinions o
                    LEFT JOIN users u ON o.submitted_by = u.user_id
                    LEFT JOIN opinion_targets t ON o.target_id = t.target_id
                    LEFT JOIN analytics a ON o.opinion_id = a.opinion_id
                    ORDER BY o.submitted_at DESC;
                """)
                rows = cur.fetchall()
        out = []
        for r in rows:
            sentiment = rating = None
            if r[5]:
                try:
                    parsed = r[5] if isinstance(r[5], dict) else json.loads(r[5])
                    sentiment = parsed.get("sentiment")
                    rating = parsed.get("rating")
                except Exception:
                    pass
            out.append({
                "opinion_id": r[0],
                "user": "Anonymous",
                "target": r[2] or "Unknown",
                "content": r[3],
                "timestamp": r[4].isoformat(),
                "sentiment": sentiment,
                "rating": rating
            })
        return jsonify(out)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/feedbacks", methods=["GET"])
def admin_all_feedbacks():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        fr.response_id,
                        fr.submitted_at,
                        ra.answer_text,
                        a.result
                    FROM feedback_responses fr
                    LEFT JOIN response_answers ra ON fr.response_id = ra.response_id
                    LEFT JOIN analytics a ON a.feedback_id = fr.response_id
                    ORDER BY fr.submitted_at DESC;
                """)
                rows = cur.fetchall()
        feedbacks = []
        for r in rows:
            rating = sentiment = None
            if r[3]:
                try:
                    parsed = r[3] if isinstance(r[3], dict) else json.loads(r[3])
                    rating = parsed.get("rating")
                    sentiment = parsed.get("sentiment")
                except Exception:
                    pass
            feedbacks.append({
                "response_id": r[0],
                "timestamp": r[1].isoformat(),
                "content": r[2],
                "rating": rating,
                "sentiment": sentiment
            })
        return jsonify(feedbacks)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/chain", methods=["GET"])
def view_chain():
    return jsonify(blockchain.to_dict())

@app.route("/api/admin/verify_chain", methods=["GET"])
def verify_chain():
    valid = blockchain.is_valid()
    return jsonify({"valid": valid, "length": len(blockchain.chain), "message": "Blockchain integrity verified ✅" if valid else "⚠️ Blockchain tampered!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)