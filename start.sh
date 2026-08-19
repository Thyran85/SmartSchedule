#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/venv"

echo "==================================="
echo "  SmartSchedule - Démarrage"
echo "==================================="

# ── 0. Activer le venv ──────────────────────────────────────────────
echo ""
echo "[1/5] Activation de l'environnement Python..."
source "$VENV_DIR/bin/activate"
echo "    → $(which python)"

# ── 1. Dépendances ─────────────────────────────────────────────────
echo ""
echo "[2/5] Vérification des dépendances..."

if [ -f "$VENV_DIR/bin/python" ]; then
    echo "  → Python OK"
else
    echo "  Installation Python..."
    pip install -r "$ROOT_DIR/backend/requirements.txt" -q
fi

if [ -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "  → Node.js OK"
else
    echo "  Installation Node.js..."
    npm --prefix "$ROOT_DIR/frontend" install --silent
fi

# ── 2. Configuration ────────────────────────────────────────────────
echo ""
echo "[3/5] Configuration backend..."

if [ -f "$ROOT_DIR/backend/.env" ]; then
    set -a
    source "$ROOT_DIR/backend/.env"
    set +a
    echo "  → .env chargé"
else
    echo "  → Pas de .env, valeurs par défaut"
fi

echo "  → Migrations..."
python "$ROOT_DIR/backend/manage.py" makemigrations 2>&1 | tail -2
python "$ROOT_DIR/backend/manage.py" migrate 2>&1 | tail -2

# ── 3. Données ──────────────────────────────────────────────────────
echo ""
echo "[4/5] Données..."

echo "  → Nettoyage des anciennes données..."
python "$ROOT_DIR/backend/manage.py" flush --no-input 2>&1 | tail -1 | sed 's/^/    /'

echo "  → Superuser admin..."
echo "from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@lycee.fr', 'admin')
    print('    Créé (admin / admin)')
else:
    print('    Déjà existant')" | python "$ROOT_DIR/backend/manage.py" shell 2>&1 | grep '    '

echo "  → Seed data..."
python "$ROOT_DIR/backend/manage.py" seed_data 2>&1 | while IFS= read -r line; do
    if echo "$line" | grep -qE '^  (✓|⚠)'; then
        echo "$line"
    fi
done

# ── 4. Démarrage ────────────────────────────────────────────────────
echo ""
echo "[5/5] Libération des ports déjà utilisés..."

PIDS=""
for p in 8000 5173 5174; do
    if command -v lsof >/dev/null 2>&1; then
        PIDS="$PIDS $(lsof -t -i :$p 2>/dev/null || true)"
    elif command -v fuser >/dev/null 2>&1; then
        PIDS="$PIDS $(fuser $p/tcp 2>/dev/null || true)"
    fi
done
PIDS=$(echo "$PIDS" | tr ' ' '\n' | grep -v '^$' | sort -u)
if [ -n "$PIDS" ]; then
    echo "  → Arrêt des processus existants (ports 8000/5173/5174)..."
    kill $PIDS 2>/dev/null || true
    sleep 1
else
    echo "  → Aucun port occupé, tout est libre."
fi

echo ""
echo "Démarrage des serveurs..."
echo ""
echo "  Backend API :   http://localhost:8000/api/"
echo "  Admin Django :  http://localhost:8000/admin/"
echo "  Documentation : http://localhost:8000/api/docs/"
echo "  Frontend :      http://localhost:5173"
echo ""
echo "  Identifiants admin : admin / admin"
echo ""

python "$ROOT_DIR/backend/manage.py" runserver 0.0.0.0:8000 &
BACKEND_PID=$!

npm --prefix "$ROOT_DIR/frontend" run dev &
FRONTEND_PID=$!

echo ""
echo "  Appuyez sur Ctrl+C pour arrêter"
echo "==================================="

cleanup() {
    echo ""
    echo "Arrêt des serveurs..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM
wait
