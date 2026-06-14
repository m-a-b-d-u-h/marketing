#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/m-a-b-d-u-h/marketing.git"
APP_DIR="$HOME/marketing"
ENV_FILE="$APP_DIR/.env"

echo "[1/6] Checking Node.js & installing PM2..."
command -v node &>/dev/null || { echo "Node.js not found"; exit 1; }
npm install -g pm2

echo "[2/6] Cloning repo..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "[3/6] Installing dependencies..."
npm ci --omit=dev

echo "[4/6] Creating .env if missing..."
if [ ! -f "$ENV_FILE" ]; then
  cp .env.example "$ENV_FILE"
  echo ">>> Edit $ENV_FILE with your secrets, then re-run this script."
  exit 1
fi

echo "[5/6] Starting app with PM2..."
pm2 start ecosystem.config.js
pm2 save

echo "[6/6] Enabling PM2 on boot..."
pm2 startup systemd -u "$(whoami)" --hp "$HOME"

echo ""
echo "✓ Setup complete!"
echo "   App:  $APP_DIR"
echo "   PM2:  pm2 list"
echo "   Logs: pm2 logs marketing-app"
echo ""
echo "Make sure BUFFER_TOKEN is set in $ENV_FILE"
