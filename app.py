import json
import math
import mimetypes
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000
BRUTEFORCE_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789"
ASSUMED_CRACK_RATE = 1e9
DEFAULT_WORDLIST = [
    "123456", "password", "123456789", "12345678", "12345", "111111",
    "1234567", "sunshine", "qwerty", "iloveyou", "princess", "admin",
    "welcome", "666666", "abc123", "football", "123123", "monkey",
    "654321", "!@#$%^&*", "charlie", "aa123456", "donald", "password1",
    "qwerty123", "zxcvbnm", "1q2w3e4r", "dragon", "master", "hello",
    "freedom", "whatever", "qazwsx", "trustno1", "jordan23", "harley",
    "hunter", "buster", "soccer", "batman", "andrew", "tigger",
    "superman", "pokemon", "ginger", "michelle", "jessica", "pepper",
    "computer", "internet", "michelle1", "maggie", "ashley", "jennifer",
    "joshua", "cheese", "amanda", "summer", "love", "secret",
    "killer", "hottie", "george", "matrix", "naruto", "mustang",
    "access", "flower", "silver", "yellow", "daniel", "robert",
    "babygirl", "loveme", "nicole", "jasmine", "jordan", "buster1",
    "michael", "corvette", "test123", "passw0rd", "starwars", "whatever1",
    "monkey1", "letmein", "shadow", "bailey", "donald123", "asdfgh",
    "qwertyuiop", "zaq12wsx", "login", "admin123", "welcome123", "root",
    "toor", "user", "guest", "temp123"
]


def load_wordlist() -> list[str]:
    wordlist_path = ROOT / "wordlist.txt"
    if not wordlist_path.exists():
        return DEFAULT_WORDLIST.copy()

    words = [
        line.strip().lower()
        for line in wordlist_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return words or DEFAULT_WORDLIST.copy()


COMMON_PASSWORDS = load_wordlist()


def calculate_password_metrics(password: str) -> dict:
    checks = [
        {"label": "At least 8 characters", "passed": len(password) >= 8},
        {"label": "At least 12 characters", "passed": len(password) >= 12},
        {"label": "Contains uppercase letters", "passed": any(ch.isupper() for ch in password)},
        {"label": "Contains lowercase letters", "passed": any(ch.islower() for ch in password)},
        {"label": "Contains numbers", "passed": any(ch.isdigit() for ch in password)},
        {"label": "Contains special characters", "passed": any(not ch.isalnum() for ch in password)},
    ]

    has_lower = any(ch.islower() for ch in password)
    has_upper = any(ch.isupper() for ch in password)
    has_digits = any(ch.isdigit() for ch in password)
    has_special = any(not ch.isalnum() for ch in password)

    charset_size = 0
    if has_lower:
        charset_size += 26
    if has_upper:
        charset_size += 26
    if has_digits:
        charset_size += 10
    if has_special:
        charset_size += 32

    base_score = sum(1 for check in checks if check["passed"])
    entropy = len(password) * math.log2(charset_size) if password and charset_size else 0.0
    is_common_password = password.lower() in COMMON_PASSWORDS

    score = base_score
    if entropy >= 60:
        score += 1
    if len(password) >= 16:
        score += 1
    if is_common_password:
        score = max(score - 3, 0)

    rating = "Weak"
    meter_width = 28
    meter_color = "#ff6a7a"
    if score >= 7:
        rating = "Strong"
        meter_width = 100
        meter_color = "#6ef2c7"
    elif score >= 4:
        rating = "Medium"
        meter_width = 64
        meter_color = "#ffb84d"

    estimated_seconds = (charset_size ** len(password)) / ASSUMED_CRACK_RATE if password and charset_size else 0.0

    return {
        "password": password,
        "checks": checks,
        "charsetSize": charset_size,
        "entropy": entropy,
        "estimatedSeconds": estimated_seconds,
        "rating": rating,
        "meterWidth": meter_width,
        "meterColor": meter_color,
        "isCommonPassword": is_common_password,
        "wordlistSize": len(COMMON_PASSWORDS),
    }


def run_dictionary_attack(password: str) -> dict:
    started = time.perf_counter()
    normalized = password.lower()
    found_index = -1

    for index, candidate in enumerate(COMMON_PASSWORDS):
        if candidate == normalized:
            found_index = index
            break

    elapsed_ms = (time.perf_counter() - started) * 1000
    checks = found_index + 1 if found_index >= 0 else len(COMMON_PASSWORDS)

    return {
        "found": found_index >= 0,
        "checks": checks,
        "elapsedMs": elapsed_ms,
        "wordlistSize": len(COMMON_PASSWORDS),
    }


def run_bruteforce_attack(password: str) -> dict:
    normalized = password.lower()
    if not normalized:
        return {"status": "empty", "message": "Enter a password before running attacks."}
    if any(ch not in BRUTEFORCE_CHARSET for ch in normalized):
        return {
            "status": "invalid_charset",
            "message": "Brute-force simulation only supports lowercase letters and numbers for this demo.",
        }
    if len(normalized) > 4:
        return {
            "status": "too_long",
            "message": "Brute-force simulation is limited to passwords of 4 characters or fewer to avoid long wait times.",
        }

    attempts = 0
    started = time.perf_counter()

    def try_length(target_length: int, prefix: str) -> bool:
        nonlocal attempts
        if len(prefix) == target_length:
            attempts += 1
            return prefix == normalized

        for character in BRUTEFORCE_CHARSET:
            if try_length(target_length, prefix + character):
                return True
        return False

    cracked = False
    for length in range(1, len(normalized) + 1):
        if try_length(length, ""):
            cracked = True
            break

    elapsed_ms = (time.perf_counter() - started) * 1000
    return {
        "status": "ok",
        "cracked": cracked,
        "attempts": attempts,
        "elapsedMs": elapsed_ms,
    }


class PasswordAnalyzerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.serve_file(ROOT / "index.html")
            return

        if self.path == "/api/meta":
            self.send_json({"wordlistSize": len(COMMON_PASSWORDS)})
            return

        safe_path = (ROOT / unquote(self.path.lstrip("/"))).resolve()
        if ROOT in safe_path.parents or safe_path == ROOT:
            if safe_path.is_file():
                self.serve_file(safe_path)
                return

        self.send_error(404, "File not found")

    def do_POST(self):
        if self.path not in {"/api/analyze", "/api/dictionary-attack", "/api/bruteforce"}:
            self.send_error(404, "Endpoint not found")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON payload"}, status=400)
            return

        password = str(payload.get("password", ""))
        if self.path == "/api/analyze":
            self.send_json(calculate_password_metrics(password))
        elif self.path == "/api/dictionary-attack":
            self.send_json(run_dictionary_attack(password))
        else:
            self.send_json(run_bruteforce_attack(password))

    def serve_file(self, file_path: Path):
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload: dict, status: int = 200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        return


def run_server():
    server = ThreadingHTTPServer((HOST, PORT), PasswordAnalyzerHandler)
    print(f"Password Analyzer running at http://{HOST}:{PORT}")
    print("Open that URL in your browser. Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
