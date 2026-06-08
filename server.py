from pathlib import Path
from flask import Flask, jsonify, redirect, request, send_from_directory
import base64
import hashlib
import hmac
import json
import os
import secrets
import smtplib
import sqlite3
import time
from email.message import EmailMessage


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("NOTE_MAKER_DB", ROOT / "data" / "revision.db"))
SESSION_SECONDS = 60 * 60 * 24 * 30
PUBLIC_FILES = {
    "login.html",
    "register.html",
    "reset.html",
    "reset-confirm.html",
}

LOGIN_ATTEMPTS = {}
LOGIN_RATE_LIMIT_WINDOW = 10 * 60
LOGIN_MAX_ATTEMPTS = 5

app = Flask(__name__, static_folder="static", template_folder="templates")


def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def prune_login_attempts():
    cutoff = int(time.time()) - LOGIN_RATE_LIMIT_WINDOW
    for ip, timestamps in list(LOGIN_ATTEMPTS.items()):
        LOGIN_ATTEMPTS[ip] = [ts for ts in timestamps if ts > cutoff]
        if not LOGIN_ATTEMPTS[ip]:
            del LOGIN_ATTEMPTS[ip]


def record_login_attempt(ip):
    prune_login_attempts()
    LOGIN_ATTEMPTS.setdefault(ip, []).append(int(time.time()))
    return len(LOGIN_ATTEMPTS[ip])


def is_rate_limited(ip):
    prune_login_attempts()
    return len(LOGIN_ATTEMPTS.get(ip, [])) >= LOGIN_MAX_ATTEMPTS


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS password_resets (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS subjects (
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                PRIMARY KEY (user_id, name),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                title TEXT NOT NULL,
                topic TEXT,
                content TEXT NOT NULL,
                priority TEXT NOT NULL,
                exam_date TEXT,
                source TEXT,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS mindmaps (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                data TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        columns = {row["name"] for row in connection.execute("PRAGMA table_info(users)").fetchall()}
        if "email" not in columns:
            connection.execute("ALTER TABLE users ADD COLUMN email TEXT")
            connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        if "last_login" not in columns:
            connection.execute("ALTER TABLE users ADD COLUMN last_login INTEGER")

        note_columns = {row["name"] for row in connection.execute("PRAGMA table_info(notes)").fetchall()}
        if "tags" not in note_columns:
            connection.execute("ALTER TABLE notes ADD COLUMN tags TEXT")

        mindmap_columns = {row["name"] for row in connection.execute("PRAGMA table_info(mindmaps)").fetchall()}
        if "tags" not in mindmap_columns:
            connection.execute("ALTER TABLE mindmaps ADD COLUMN tags TEXT")


def hash_password(password, salt=None):
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def check_password(password, stored):
    try:
        salt_text, digest_text = stored.split("$", 1)
        salt = base64.b64decode(salt_text)
        expected = base64.b64decode(digest_text)
    except ValueError:
        return False

    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return hmac.compare_digest(actual, expected)


def current_user():
    token = request.cookies.get("revision_session")
    if not token:
        return None

    with db() as connection:
        row = connection.execute(
            """
            SELECT users.id, users.username, users.email, users.last_login
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ? AND sessions.expires_at > ?
            """,
            (token, int(time.time())),
        ).fetchone()
    return dict(row) if row else None


def require_user():
    user = current_user()
    if not user:
        return None, (jsonify({"error": "Login required"}), 401)
    return user, None


def seed_subjects(user_id):
    starter_subjects = ["English Language", "English Literature", "Maths"]
    with db() as connection:
        connection.executemany(
            "INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)",
            [(user_id, subject) for subject in starter_subjects],
        )


def send_reset_email(email, link):
    host = os.environ.get("REVISION_SMTP_HOST")
    port = int(os.environ.get("REVISION_SMTP_PORT", "587"))
    username = os.environ.get("REVISION_SMTP_USER")
    password = os.environ.get("REVISION_SMTP_PASSWORD")
    sender = os.environ.get("REVISION_SMTP_FROM", username or "note-maker@localhost")

    if not host or not username or not password:
        print(f"Password reset link for {email}: {link}")
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your Note Maker password"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        "Click this link to reset your Note Maker password:\n\n"
        f"{link}\n\n"
        "This link expires in 30 minutes."
    )

    try:
        with smtplib.SMTP(host, port) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
        return True
    except OSError as error:
        print(f"Could not send reset email to {email}: {error}")
        print(f"Password reset link for {email}: {link}")
        return False


def normalize_tags(tags):
    if isinstance(tags, list):
        tags = [tag.strip() for tag in tags if tag and tag.strip()]
        return ",".join(sorted(dict.fromkeys(tags)))
    if isinstance(tags, str):
        tags = [tag.strip() for tag in tags.split(",") if tag.strip()]
        return ",".join(sorted(dict.fromkeys(tags)))
    return ""


def note_from_row(row):
    return {
        "id": row["id"],
        "subject": row["subject"],
        "title": row["title"],
        "topic": row["topic"] or "",
        "content": row["content"],
        "priority": row["priority"],
        "examDate": row["exam_date"] or "",
        "source": row["source"],
        "tags": row["tags"].split(",") if row["tags"] else [],
    }


def note_payload(data, user_id):
    return (
        data.get("id") or secrets.token_urlsafe(12),
        user_id,
        data.get("subject", "English Language"),
        data.get("title", "").strip() or "Untitled note",
        data.get("topic", ""),
        data.get("content", ""),
        data.get("priority", "Core"),
        data.get("examDate", ""),
        data.get("source"),
        normalize_tags(data.get("tags", "")),
        int(time.time()),
    )


def set_session_cookie(response, token):
    response.set_cookie(
        "revision_session",
        token,
        max_age=SESSION_SECONDS,
        httponly=True,
        samesite="Lax",
        secure=request.is_secure,
    )
    return response


@app.after_request
def no_store(response):
    response.headers["Cache-Control"] = "no-store"
    return response


@app.route("/")
def root():
    return redirect("/index.html")


@app.route("/logout")
def logout_page():
    token = request.cookies.get("revision_session")
    if token:
        with db() as connection:
            connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
    response = redirect("/login.html")
    response.delete_cookie("revision_session")
    return response


@app.route("/<path:filename>")
def files(filename):
    if filename.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

    path = ROOT / "templates" / filename
    if not path.is_file():
        return jsonify({"error": "Not found"}), 404

    if filename not in PUBLIC_FILES and current_user() is None:
        return redirect("/login.html")

    return send_from_directory(ROOT / "templates", filename)


@app.get("/api/me")
def api_me():
    user, error = require_user()
    if error:
        return error
    return jsonify({"user": user})


@app.put("/api/me")
def api_me_put():
    user, error = require_user()
    if error:
        return error

    data = request.get_json(force=True, silent=True) or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()

    if len(username) < 3 or "@" not in email or "." not in email:
        return jsonify({"error": "Use a valid username and email."}), 400

    try:
        with db() as connection:
            connection.execute(
                "UPDATE users SET username = ?, email = ? WHERE id = ?",
                (username, email, user["id"]),
            )
    except sqlite3.IntegrityError:
        return jsonify({"error": "That email is already taken."}), 409

    return jsonify({"ok": True, "user": {"id": user["id"], "username": username, "email": email, "last_login": user.get("last_login")}})


@app.get("/api/dashboard")
def api_dashboard():
    user, error = require_user()
    if error:
        return error

    now = int(time.time())
    with db() as connection:
        notes_count = connection.execute("SELECT COUNT(*) FROM notes WHERE user_id = ?", (user["id"],)).fetchone()[0]
        subjects_count = connection.execute("SELECT COUNT(*) FROM subjects WHERE user_id = ?", (user["id"],)).fetchone()[0]
        mindmaps_count = connection.execute("SELECT COUNT(*) FROM mindmaps WHERE user_id = ?", (user["id"],)).fetchone()[0]
        upcoming = connection.execute(
            "SELECT title, subject, exam_date FROM notes WHERE user_id = ? AND exam_date != '' ORDER BY exam_date LIMIT 5",
            (user["id"],),
        ).fetchall()

    upcoming_exams = [
        {"title": row["title"], "subject": row["subject"], "examDate": row["exam_date"]}
        for row in upcoming
    ]

    return jsonify({
        "notesCount": notes_count,
        "subjectsCount": subjects_count,
        "mindmapsCount": mindmaps_count,
        "upcomingExams": upcoming_exams,
        "lastLogin": user.get("last_login"),
    })


@app.delete("/api/account")
def api_delete_account():
    user, error = require_user()
    if error:
        return error

    with db() as connection:
        connection.execute("DELETE FROM password_resets WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM notes WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM mindmaps WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM subjects WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM users WHERE id = ?", (user["id"],))

    response = jsonify({"ok": True})
    response.delete_cookie("revision_session")
    return response


@app.post("/api/register")
def api_register():
    data = request.get_json(force=True, silent=True) or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if len(username) < 3 or "@" not in email or "." not in email or len(password) < 6:
        return jsonify({"error": "Use a username, a valid email, and a password with 6+ characters."}), 400

    try:
        with db() as connection:
            cursor = connection.execute(
                "INSERT INTO users (username, email, password_hash, created_at, last_login) VALUES (?, ?, ?, ?, ?)",
                (username, email, hash_password(password), int(time.time()), int(time.time())),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "That username or email is already taken."}), 409

    seed_subjects(user_id)
    return create_session(user_id)


@app.post("/api/login")
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    ip = request.remote_addr or "unknown"

    if is_rate_limited(ip):
        return jsonify({"error": "Too many login attempts. Try again in a few minutes."}), 429

    with db() as connection:
        user = connection.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()

    if not user or not check_password(password, user["password_hash"]):
        record_login_attempt(ip)
        return jsonify({"error": "Incorrect email or password."}), 401

    with db() as connection:
        connection.execute("UPDATE users SET last_login = ? WHERE id = ?", (int(time.time()), user["id"]))

    LOGIN_ATTEMPTS.pop(ip, None)
    return create_session(user["id"])


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + SESSION_SECONDS
    with db() as connection:
        connection.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at),
        )
    return set_session_cookie(jsonify({"ok": True}), token)


@app.post("/api/logout")
def api_logout():
    token = request.cookies.get("revision_session")
    if token:
        with db() as connection:
            connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
    response = jsonify({"ok": True})
    response.delete_cookie("revision_session")
    return response


@app.post("/api/request-password-reset")
def api_request_password_reset():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email", "").strip().lower()
    dev_link = None

    with db() as connection:
        user = connection.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
        if user:
            token = secrets.token_urlsafe(32)
            expires_at = int(time.time()) + 60 * 30
            connection.execute(
                "INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)",
                (token, user["id"], expires_at),
            )
            link = f"{request.host_url.rstrip('/')}/reset-confirm.html?token={token}"
            sent = send_reset_email(email, link)
            if not sent:
                dev_link = link

    return jsonify({
        "ok": True,
        "message": "If that email has an account, a reset link has been sent.",
        "devLink": dev_link,
    })


@app.post("/api/reset-password")
def api_reset_password():
    data = request.get_json(force=True, silent=True) or {}
    token = data.get("token", "")
    password = data.get("password", "")

    if len(password) < 6:
        return jsonify({"error": "Password needs 6+ characters."}), 400

    with db() as connection:
        reset = connection.execute(
            """
            SELECT * FROM password_resets
            WHERE token = ? AND used = 0 AND expires_at > ?
            """,
            (token, int(time.time())),
        ).fetchone()
        if not reset:
            return jsonify({"error": "This reset link is invalid or expired."}), 400

        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(password), reset["user_id"]),
        )
        connection.execute("UPDATE password_resets SET used = 1 WHERE token = ?", (token,))
        connection.execute("DELETE FROM sessions WHERE user_id = ?", (reset["user_id"],))

    return jsonify({"ok": True})


@app.get("/api/subjects")
def api_subjects_get():
    user, error = require_user()
    if error:
        return error
    with db() as connection:
        rows = connection.execute(
            "SELECT name FROM subjects WHERE user_id = ? ORDER BY rowid",
            (user["id"],),
        ).fetchall()
    return jsonify({"subjects": [row["name"] for row in rows]})


@app.post("/api/subjects")
def api_subjects_post():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(force=True, silent=True) or {}
    subject = data.get("name", "").strip()
    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    with db() as connection:
        connection.execute("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)", (user["id"], subject))
    return jsonify({"ok": True})


@app.get("/api/notes")
def api_notes_get():
    user, error = require_user()
    if error:
        return error
    note_id = request.args.get("id")
    with db() as connection:
        if note_id:
            rows = connection.execute(
                "SELECT * FROM notes WHERE user_id = ? AND id = ?",
                (user["id"], note_id),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC",
                (user["id"],),
            ).fetchall()
    return jsonify({"notes": [note_from_row(row) for row in rows]})


@app.post("/api/notes")
def api_notes_post():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(force=True, silent=True) or {}
    note = note_payload(data, user["id"])
    with db() as connection:
        connection.execute(
            """
            INSERT INTO notes (id, user_id, subject, title, topic, content, priority, exam_date, source, tags, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            note,
        )
        connection.execute("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)", (user["id"], data.get("subject")))
    return jsonify({"note": data})


@app.put("/api/notes")
def api_notes_put():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(force=True, silent=True) or {}
    if not data.get("id"):
        return jsonify({"error": "Note id is required"}), 400
    note = note_payload(data, user["id"])
    with db() as connection:
        connection.execute(
            """
            UPDATE notes
            SET subject = ?, title = ?, topic = ?, content = ?, priority = ?, exam_date = ?, source = ?, tags = ?, updated_at = ?
            WHERE user_id = ? AND id = ?
            """,
            (note[2], note[3], note[4], note[5], note[6], note[7], note[8], note[9], note[10], user["id"], data["id"]),
        )
        connection.execute("INSERT OR IGNORE INTO subjects (user_id, name) VALUES (?, ?)", (user["id"], data.get("subject")))
    return jsonify({"ok": True})


@app.delete("/api/notes")
def api_notes_delete():
    user, error = require_user()
    if error:
        return error
    note_id = request.args.get("id")
    if not note_id:
        return jsonify({"error": "Note id is required"}), 400
    with db() as connection:
        connection.execute("DELETE FROM notes WHERE user_id = ? AND id = ?", (user["id"], note_id))
    return jsonify({"ok": True})


@app.get("/api/mindmaps")
def api_mindmaps_get():
    user, error = require_user()
    if error:
        return error
    mindmap_id = request.args.get("id")
    with db() as connection:
        if mindmap_id:
            rows = connection.execute(
                "SELECT id, title, data, tags, updated_at FROM mindmaps WHERE user_id = ? AND id = ?",
                (user["id"], mindmap_id),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT id, title, data, tags, updated_at FROM mindmaps WHERE user_id = ? ORDER BY updated_at DESC",
                (user["id"],),
            ).fetchall()
    mindmaps = [{
        "id": row["id"],
        "title": row["title"],
        "data": row["data"],
        "tags": row["tags"].split(",") if row["tags"] else [],
        "updatedAt": row["updated_at"],
    } for row in rows]
    return jsonify({"mindmaps": mindmaps})


@app.post("/api/mindmaps")
def api_mindmaps_post():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(force=True, silent=True) or {}
    mindmap_id = data.get("id") or secrets.token_urlsafe(12)
    title = data.get("title", "").strip() or "Untitled mindmap"
    mindmap_data = data.get("data", {})
    tags = normalize_tags(data.get("tags", ""))
    
    with db() as connection:
        connection.execute(
            "INSERT INTO mindmaps (id, user_id, title, data, tags, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (mindmap_id, user["id"], title, json.dumps(mindmap_data), tags, int(time.time())),
        )
    return jsonify({"id": mindmap_id, "ok": True})


@app.put("/api/mindmaps")
def api_mindmaps_put():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(force=True, silent=True) or {}
    if not data.get("id"):
        return jsonify({"error": "Mindmap id is required"}), 400
    
    title = data.get("title", "").strip() or "Untitled mindmap"
    mindmap_data = data.get("data", {})
    tags = normalize_tags(data.get("tags", ""))
    
    with db() as connection:
        connection.execute(
            "UPDATE mindmaps SET title = ?, data = ?, tags = ?, updated_at = ? WHERE user_id = ? AND id = ?",
            (title, json.dumps(mindmap_data), tags, int(time.time()), user["id"], data["id"]),
        )
    return jsonify({"ok": True})


@app.delete("/api/mindmaps")
def api_mindmaps_delete():
    user, error = require_user()
    if error:
        return error
    mindmap_id = request.args.get("id")
    if not mindmap_id:
        return jsonify({"error": "Mindmap id is required"}), 400
    with db() as connection:
        connection.execute("DELETE FROM mindmaps WHERE user_id = ? AND id = ?", (user["id"], mindmap_id))
    return jsonify({"ok": True})


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
