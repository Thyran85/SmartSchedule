#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==================================="
echo "  SmartSchedule - Démarrage"
echo "==================================="

# ── 1. Installation des dépendances ──────────────────────────────────
echo ""
echo "[1/4] Installation des dépendances..."

echo "  → Python..."
cd "$ROOT_DIR/backend"
pip install -r requirements.txt 2>&1 | tail -1

echo "  → Node.js..."
cd "$ROOT_DIR/frontend"
npm install --silent 2>&1 | tail -1

# ── 2. Configuration backend ──────────────────────────────────────────
echo ""
echo "[2/4] Configuration backend..."

cd "$ROOT_DIR/backend"
echo "  → Chargement du .env..."
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo "    OK"
else
  echo "    .env introuvable, utilisation des valeurs par défaut"
fi

echo "  → Migrations..."
python manage.py makemigrations 2>&1 | tail -1
python manage.py migrate 2>&1 | tail -2

# ── 3. Données de test ───────────────────────────────────────────────
echo ""
echo "[3/4] Données de test..."

echo "  → Superuser admin..."
echo "from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@lycee.fr', 'admin')
    print('    Créé (admin / admin)')
else:
    print('    Déjà existant')" | python manage.py shell 2>&1

echo "  → Seed data..."
python manage.py seed_data 2>&1 | tail -1

# ── 4. Démarrage des serveurs ────────────────────────────────────────
echo ""
echo "[4/4] Démarrage des serveurs..."
echo ""
echo "  Backend API :   http://localhost:8000/api/"
echo "  Admin Django :  http://localhost:8000/admin/"
echo "  Documentation : http://localhost:8000/api/docs/"
echo "  Frontend :      http://localhost:5173"
echo ""
echo "  Identifiants admin : admin / admin"
echo ""

cd "$ROOT_DIR/backend"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Appuyez sur Ctrl+C pour arrêter"
echo "==================================="

cleanup() {
  echo ""
  echo "Arrêt des serveurs..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM
wait
