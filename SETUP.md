# Diabetic Retinopathy Detection — Setup Guide

This zip does NOT include `node_modules/` or the Python `venv/` folders
(they're huge and machine-specific) — install them fresh with the steps
below.

## 1. Backend (Flask + AI models)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe app.py
```

Wait for the console to print `Model loaded successfully. 3-model ensemble
ready.` (takes about 5-10 seconds). The backend runs on
`http://127.0.0.1:5000`.

The three model files it needs (`dr_model_working.keras`, `dr_model_2.keras`,
`dr_model_3.keras`) are already included in `backend/`.

## 2. Frontend (Next.js)

In a **separate** terminal, from the project root:

```powershell
pnpm install
pnpm dev
```

Wait for `Ready in ...` and `Local: http://localhost:3000`.

If you don't have pnpm: `npm install -g pnpm`

## 3. Use it

Open `http://localhost:3000`, sign up / log in, go to the dashboard, and
upload a retina image (JPG/PNG, up to 5MB).

## Notes

- `model-api/` contains a ready-to-deploy Flask API scaffold for Hugging Face
  Spaces or ngrok, if you want the backend reachable from somewhere other
  than your own machine — see `model-api/README.md`.
- The `.env` file has a `FLASK_API_URL` variable the frontend's
  `/api/predict` route uses to reach the backend — defaults to
  `http://127.0.0.1:5000/predict` for local use.
- Model accuracy is currently ~70% (an ensemble of 3 EfficientNet models) on
  our internal test set — see the conversation history for how that was
  measured.
