# VPS hosting — awaiting domain and administrator activation

## Detected state
No Coolify, Docker CLI or Caddy detected. builder cannot use passwordless sudo. FFmpeg/FFprobe are installed. App uses Node 22 and pnpm; no Vercel deployment. deploy/kobo.service runs the production Next server on loopback port 3000; deploy/Caddyfile.example is a template, not an active HTTPS site.

## Prerequisites
Owner supplies the domain/subdomain; point its DNS A record to this VPS's public IPv4. Publish AAAA only if IPv6 really reaches this VPS. Allow inbound TCP 80/443 in host/provider firewalls (UDP 443 optional for HTTP/3). Do not expose port 3000 publicly. Confirm no existing proxy owns these ports before activation.

## Build as builder (never run package install as root)
```sh
cd /home/builder/.t3/projects/kobo/kobo-app
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test && pnpm build
mkdir -p private
chmod 700 private
```
No .env is needed for the placeholder. When product integrations are approved, create .env.local privately with mode 600. Never paste secrets into chat/commands or commit them. The service's optional EnvironmentFile expects simple KEY=value assignments.

## Administrator step (requires sudo password entered in your own terminal)
These commands are prepared, **not executed**:
```sh
sudo apt-get update
sudo apt-get install -y caddy
sudo install -m 644 deploy/kobo.service /etc/systemd/system/kobo.service
sudo systemctl daemon-reload
sudo systemctl enable --now kobo
```
Copy the example locally, replace `kobo.example.com` with the approved real domain, and review it. Preserve any existing Caddy sites; do not blindly overwrite an existing configuration. For a fresh Caddy installation only:
```sh
sudo install -m 644 deploy/Caddyfile.example /etc/caddy/Caddyfile
sudoedit /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```
Caddy obtains/renews a public TLS certificate automatically once DNS and inbound reachability work. A config file alone is NOT evidence HTTPS works. Do not commit a generated key/certificate.

## Verify after activation
```sh
systemctl is-active kobo caddy
curl -fsS http://127.0.0.1:3000/
# Substitute your real domain:
curl -I https://YOUR_DOMAIN/
```
Inspect the external HTTPS page in a browser with a valid certificate and no warning. On Android Chrome, later verify actual getUserMedia permission/recording once that feature exists. The current placeholder does not record audio. HTTPS is only a prerequisite for WhatsApp: webhook verification/signature handling is NOT implemented and no webhook should be configured yet.

## Operations
Builds are explicit; restart kobo only after a passing build: `sudo systemctl restart kobo`. Logs: `journalctl -u kobo -u caddy --since today` (never publish sensitive output). Persistent private/ and database/audio files must survive deployments and remain outside Git/public/. The systemd unit allows writes only to .next and private/; future DB paths must respect this boundary. Production backup/restore, audio retention and passcode/session hardening remain unimplemented and must be completed before real trader data is accepted.
