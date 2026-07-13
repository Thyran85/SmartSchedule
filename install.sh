#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==================================="
echo "  SmartSchedule - Installation"
echo "==================================="

VENV_DIR="${1:-$ROOT_DIR/venv}"

echo ""
echo "[1/3] Création du venv..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
echo "    → $VENV_DIR"

echo ""
echo "[2/3] Installation des dépendances Python..."
pip install --upgrade pip -q
pip install --only-binary :all: -r "$ROOT_DIR/backend/requirements.txt"
echo "    → OK"

echo ""
echo "[3/3] Installation des dépendances Node.js..."
cd "$ROOT_DIR/frontend"
npm install --silent
echo "    → OK"

echo ""
echo "==================================="
echo ""
echo "  Pour activer le venv :"
echo "    source $VENV_DIR/bin/activate"
echo ""
echo "  Pour lancer l'app :"
echo "    ./start.sh"
echo ""
echo "==================================="
