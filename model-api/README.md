---
title: DR Detection Model API
emoji: 👁️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Diabetic Retinopathy — Model API

Flask API serving a 3-model EfficientNet ensemble (70% measured accuracy) over
HTTP, so the Next.js frontend can call a real public URL instead of
`127.0.0.1:5000`. Also rejects images that don't look like retinal fundus
photos (e.g. random everyday photos) before running a prediction.

## Endpoints

- `GET /health` -> `{"status": "ok", "model_load_seconds": <float>}`
- `POST /predict` -> multipart/form-data, field `image` (an image file) ->
  `{"class": "No DR", "confidence": {"0": 0.99, "1": 0.00, ...}}`
  (or `400` with an error message if the image doesn't look like a retina photo)

## Before you deploy

1. Copy these 3 files from `backend/` into this folder:
   - `dr_model_working.keras` (~21MB)
   - `dr_model_2.keras` (~35MB)
   - `dr_model_3.keras` (~49MB)
2. Track them with Git LFS before pushing (~105MB total):
   ```bash
   git lfs install
   git lfs track "*.keras"
   git add .gitattributes dr_model_working.keras dr_model_2.keras dr_model_3.keras
   git commit -m "Add DR ensemble models"
   git push
   ```
3. Watch the Space's **Logs** tab for `All 3 ensemble members loaded in Xs.`
   — should take a few seconds on CPU.

## Testing once live

```bash
curl https://<your-username>-<space-name>.hf.space/health

curl -X POST -F "image=@sample_retina.jpg" \
  https://<your-username>-<space-name>.hf.space/predict
```

## Wiring the frontend to it

In the Next.js project (not this folder), set the server-only env var
(Vercel dashboard -> Settings -> Environment Variables, or `.env.local` for
local dev):

```
FLASK_API_URL=https://<your-username>-<space-name>.hf.space/predict
```

`app/api/predict/route.js` already reads this variable and proxies requests
to it — no frontend component changes needed.

## Quick/temporary alternative: ngrok

If you just want to prove this works today without setting up a Space:

1. On the machine where `backend/app.py` already runs successfully, install
   ngrok and authenticate once: `ngrok config add-authtoken <token>`
2. Start the Flask server as usual (`python app.py` from `backend/`), then in
   another terminal: `ngrok http 5000`
3. ngrok prints a public HTTPS URL, e.g. `https://a1b2c3d4.ngrok-free.app`.
4. Set `FLASK_API_URL=https://a1b2c3d4.ngrok-free.app/predict`.

Caveats: the URL changes every time you restart ngrok on the free plan, and
your PC + Flask server need to stay running the whole time anyone uses the
site. Treat this as a bridge to the Hugging Face Space, not a replacement.
