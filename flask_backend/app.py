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

import bleach
from flask_wtf.csrf import CSRFProtect, generate_csrf
from werkzeug.utils import secure_filename
import re
import jwt
from functools import wraps
from datetime import timedelta
import time
import sys

blockchain = Blockchain()

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"
app.config["JWT_SECRET_KEY"] = "supersecretjwtkey"
csrf = CSRFProtect(app)
frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": allowed_origins}})

def valid_username(username):
    return isinstance(username, str) and re.fullmatch(r"[A-Za-z0-9_]{3,30}", username)

def valid_password(password):
    return isinstance(password, str) and len(password) >= 5
def valid_content(content):
    return isinstance(content, str) and 1 <= len(content.strip()) <= 1000
    
# restricted CORS origins to frontend port
def get_conn():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "nulltrace"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        host=os.getenv("DB_HOST", "localhost"),
    )

MAX_RETRIES = 5
RETRY_DELAY = 3

for attempt in range(MAX_RETRIES):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';")
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;")
        print("Database initialization successful.")
        break
    except psycopg2.OperationalError as e:
        print(f"Database connection failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
        if attempt < MAX_RETRIES - 1:
            print(f"Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)
        else:
            print("Fatal: Could not connect to the database after multiple attempts.")
            sys.exit(1)

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

ADMIN_USERNAME = "admin"

@app.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    # Generate and return a CSRF token for the frontend to use
    return jsonify({"csrf_token": generate_csrf()})

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            data = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
            request.user = data
        except Exception:
            return jsonify({"error": "Token is invalid or expired"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, "user") or request.user.get("role") != "admin":
            return jsonify({"error": "Admin privilege required"}), 403
        return f(*args, **kwargs)
    return decorated

@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    if not valid_username(username):
        return jsonify({"error": "Invalid username format. Must be 3-30 alphanumeric characters."}), 400
    if not valid_password(password):
        return jsonify({"error": "Invalid password format. Must be at least 5 characters long."}), 400
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    role = "user"
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
    if not valid_username(username):
        return jsonify({"error": "Invalid username format"}), 400
    if not valid_password(password):
        return jsonify({"error": "Invalid password format"}), 400
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
            
        token = jwt.encode({
            "user_id": user[0],
            "name": user[1],
            "role": user[2],
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, app.config["JWT_SECRET_KEY"], algorithm="HS256")
        
        return jsonify({"success": True, "token": token, "user_id": user[0], "name": user[1], "role": user[2]})
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
    if not valid_content(name):
        return jsonify({"error": "Invalid target name format"}), 400
    if category and not valid_content(category):
        return jsonify({"error": "Invalid target category format"}), 400
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
        content = bleach.clean(content)
        #cleans the input
        if not target_id or not content:
            return jsonify({"error": "Missing target_id or content"}), 400
        if not valid_content(content):
            return jsonify({"error": "Invalid content format. Must be 1-1000 characters."}), 400
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
    if request.is_json:
        data = request.json or {}
        submitted_by = data.get("submitted_by")
        content = data.get("content")
    else:
        submitted_by = request.form.get("submitted_by")
        content = request.form.get("content", "")
        
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                # 1. Extension whitelist (prevent malicious executable uploads)
                if not file.filename.lower().endswith('.txt'):
                    return jsonify({"error": "Only .txt files are allowed."}), 400
                
                # 2. Safe filename handling (prevent path traversal attacks)
                filename = secure_filename(file.filename)
                
                # 3. MIME validation (prevent MIME spoofing)
                if file.mimetype != 'text/plain':
                    return jsonify({"error": "Invalid MIME type. Must be text/plain."}), 400
                
                # 4. File size restriction (1MB limit to prevent oversized upload abuse)
                file.seek(0, os.SEEK_END)
                if file.tell() > 1 * 1024 * 1024:
                    return jsonify({"error": "File exceeds 1MB limit."}), 413
                file.seek(0)
                
                # Read file safely
                file_content = file.read().decode('utf-8', errors='ignore')
                content = (content + "\n\n" + file_content).strip() if content else file_content.strip()

    if not submitted_by or not content:
        return jsonify({"error": "Missing submitted_by or content"}), 400
    if not valid_content(content):
        return jsonify({"error": "Invalid feedback content format. Must be 1-1000 characters."}), 400

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
                    "INSERT INTO analytics (analytics_id, result, engine_id, response_id, analyzed_at) VALUES (%s, %s, %s, %s, %s);",
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
@token_required
@admin_required
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
@token_required
@admin_required
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
@token_required
@admin_required
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
                    LEFT JOIN analytics a ON a.response_id = fr.response_id
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
@token_required
@admin_required
def view_chain():
    return jsonify(blockchain.to_dict())

@app.route("/api/admin/verify_chain", methods=["GET"])
@token_required
@admin_required
def verify_chain():
    valid = blockchain.is_valid()
    return jsonify({"valid": valid, "length": len(blockchain.chain), "message": "Blockchain integrity verified ✅" if valid else "⚠️ Blockchain tampered!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)