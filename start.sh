#!/bin/bash
# SmartSchedule - Script de démarrage

echo "==================================="
echo "  SmartSchedule - Démarrage"
echo "==================================="

# Backend setup
echo ""
echo "[1/4] Installation des dépendances Python..."
cd backend
pip install -r requirements.txt 2>/dev/null || pip install Django djangorestframework django-cors-headers django-filter drf-spectacular openpyxl reportlab python-dateutil

echo ""
echo "[2/4] Migration base de données..."
python manage.py makemigrations
python manage.py migrate

echo ""
echo "[3/4] Création des données de test..."
echo "from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@lycee.fr', 'admin')" | python manage.py shell 2>/dev/null || true
python manage.py seed_data

echo ""
echo "[4/4] Démarrage des serveurs..."
echo ""
echo "  Backend API:  http://localhost:8000/api/"
echo "  Admin Django: http://localhost:8000/admin/"
echo "  Documentation: http://localhost:8000/api/docs/"
echo ""
echo "  Identifiants admin: admin / admin"
echo ""

# Start backend
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!

echo "  Frontend: http://localhost:5173"
echo ""
echo "  Appuyez sur Ctrl+C pour arrêter"
echo "==================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
