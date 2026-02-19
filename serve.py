"""
Mondrim Presence — HTTPS dev server
Binds to Tailscale IP only (100.83.203.41:8443)
Self-signed cert → allows getUserMedia (mic) in browser
"""
import http.server
import ssl
import os

HOST = "100.83.203.41"
PORT = 8443
CERT = "/tmp/ts.crt"
KEY  = "/tmp/ts.key"

os.chdir(os.path.dirname(os.path.abspath(__file__)))

httpd = http.server.HTTPServer((HOST, PORT), http.server.SimpleHTTPRequestHandler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=CERT, keyfile=KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print(f"Serving on https://{HOST}:{PORT}")
print("Only accessible via Tailscale network.")
httpd.serve_forever()
