"""
Mondrim Presence — HTTPS server with state machine API
Tailscale-only: https://100.83.203.41:8443

Endpoints:
  GET  /         → serves static files
  GET  /events   → SSE stream (browser subscribes, receives state updates)
  GET  /state    → returns current state as JSON
  POST /state    → update state  body: {"state": "thinking", "emotion": "neutral"}

Push state from anywhere on tailnet:
  curl -sk -X POST https://100.83.203.41:8443/state \
       -H "Content-Type: application/json" \
       -d '{"state":"thinking"}'
"""

import http.server
import ssl
import os
import json
import threading
import queue

HOST = "100.83.203.41"
PORT = 8443
CERT = "/etc/mondrim/ts.crt"
KEY  = "/etc/mondrim/ts.key"

SERVE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Global state ────────────────────────────────────────────────
current_state = {"state": "idle", "emotion": "neutral"}
state_lock    = threading.Lock()

# ── SSE client registry ─────────────────────────────────────────
sse_clients = []
sse_lock    = threading.Lock()

def push_to_clients(data):
    payload = "data: {}\n\n".format(json.dumps(data)).encode()
    with sse_lock:
        dead = []
        for q in sse_clients:
            try:
                q.put_nowait(payload)
            except Exception:
                dead.append(q)
        for q in dead:
            sse_clients.remove(q)

# ── Request handler ─────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVE_DIR, **kwargs)

    # ── POST /state ─────────────────────────────────────────────
    def do_POST(self):
        if self.path != "/state":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)

        try:
            data = json.loads(body)
        except Exception:
            self.send_error(400, "Invalid JSON")
            return

        with state_lock:
            current_state.update(data)
            snapshot = dict(current_state)

        push_to_clients(snapshot)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "state": snapshot}).encode())

    # ── GET ──────────────────────────────────────────────────────
    def do_GET(self):
        # Current state as JSON
        if self.path == "/state":
            with state_lock:
                snapshot = dict(current_state)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(snapshot).encode())
            return

        # SSE stream
        if self.path == "/events":
            self.send_response(200)
            self.send_header("Content-Type",  "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection",    "keep-alive")
            self.end_headers()

            # Send current state immediately on connect
            with state_lock:
                snapshot = dict(current_state)
            try:
                self.wfile.write("data: {}\n\n".format(json.dumps(snapshot)).encode())
                self.wfile.flush()
            except Exception:
                return

            # Register client queue
            q = queue.Queue()
            with sse_lock:
                sse_clients.append(q)

            try:
                while True:
                    try:
                        msg = q.get(timeout=20)
                        self.wfile.write(msg)
                        self.wfile.flush()
                    except queue.Empty:
                        # Keepalive ping
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
            except Exception:
                pass
            finally:
                with sse_lock:
                    if q in sse_clients:
                        sse_clients.remove(q)
            return

        # Static files
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # suppress per-request noise

# ── Start server ─────────────────────────────────────────────────
httpd = http.server.ThreadingHTTPServer((HOST, PORT), Handler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=CERT, keyfile=KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print("Mondrim Presence running on https://{}:{}".format(HOST, PORT))
print("POST /state to update avatar. GET /events to subscribe.")
httpd.serve_forever()
