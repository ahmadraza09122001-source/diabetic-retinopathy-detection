# Fixing "model failed to load" — setup guide

## What's actually going on

Your project knowledge only contains config/lockfiles (`package.json`,
`requirements.txt`, `_env`, etc.) and two logs — no actual frontend/backend
source code or the model file itself, so there was nothing here to literally
compile or run. But the logs you do have point straight at the cause:

1. **`_env` hardcodes the backend URL to your own machine:**
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/predict
   ```
   `127.0.0.1` always means "this device," never "the developer's PC." The
   moment the frontend runs anywhere but your machine with Flask already
   running — a deployed site, a friend's laptop, even just closing your
   terminal — every prediction request fails with exactly the symptom you
   described.

2. **The Flask/TensorFlow backend was never deployed anywhere.** Your
   project structure (Next.js + Vercel-flavored `.gitignore`) strongly
   suggests the frontend is meant to be deployed, but nothing in a static
   Vercel-style deployment keeps a Flask + TensorFlow process running —
   there's no server for `127.0.0.1:5000` to even refer to once it's live.

3. **`model.log` shows the model took ~25 minutes to load** (21:56:22 →
   22:21:42) before your local server was ready. That's a serious problem
   independent of the above — no hosting platform (Hugging Face Spaces
   included) will wait 25 minutes for a container to start before deciding
   it's crashed. Before you deploy anywhere, it's worth checking *why* it's
   that slow:
   - Is `2025(84%).keras` sitting in a OneDrive/Google Drive-synced folder?
     Cloud-sync file locks are a very common cause of slow first-reads on
     Windows.
   - Is antivirus real-time scanning kicking in on a large file the first
     time it's opened?
   - How big is the file, actually? (`os.path.getsize(...)` on the model path)
   
   A healthy load for most Keras models, even large ones, is seconds to low
   minutes — 25 minutes points at I/O, not the model architecture itself.

## The fix

Split the app in two, each hosted somewhere suited to it:
- **Next.js frontend** → stays wherever it is now (Vercel or similar)
- **Flask + TensorFlow model** → its own always-on service with a real
  public URL, which the frontend calls instead of `127.0.0.1`

I've built and tested (end-to-end, including the full request path through
a Next.js route into a Flask server) both pieces below. Two ways to get the
model its public URL — pick one:

| | Hugging Face Spaces | ngrok |
|---|---|---|
| Good for | The real, permanent fix | A quick test today |
| URL stability | Fixed, permanent | Changes on every restart (free plan) |
| Your PC has to stay on | No | Yes |
| Cost | Free (CPU tier) | Free (with limits) |

### Option A — Hugging Face Spaces (recommended)

1. Create a free account at huggingface.co, then **New Space** → any name →
   **Docker** SDK → **Create Space**.
2. Take everything in `model-api/` from this delivery and push it to that
   Space's git repo (Spaces are just git repos):
   ```bash
   git clone https://huggingface.co/spaces/<your-username>/<space-name>
   cd <space-name>
   cp /path/to/model-api/* .
   ```
3. Add your real model (see `model-api/README.md` for the Git LFS command
   if the file is large — likely, given it's a 3-branch ensemble) and
   commit/push:
   ```bash
   git add .
   git commit -m "Deploy DR model API"
   git push
   ```
4. Hugging Face builds the Docker image automatically. Watch the **Logs**
   tab — you're looking for the same "Model loaded successfully" line your
   local `model.log` shows.
5. Your API is now live at `https://<your-username>-<space-name>.hf.space`.
   Test it:
   ```bash
   curl https://<your-username>-<space-name>.hf.space/health
   ```
6. In your Next.js project, set (Vercel dashboard → Settings → Environment
   Variables, or `.env.local` for local dev):
   ```
   MODEL_API_URL=https://<your-username>-<space-name>.hf.space/predict
   ```
7. Add `nextjs-integration/app/api/predict/route.ts` from this delivery to
   your project at that exact path, and update your existing upload
   component's fetch call per
   `nextjs-integration/UPDATE_YOUR_UPLOAD_COMPONENT.ts` (it's a one-line
   change: call `/api/predict` instead of `127.0.0.1:5000/predict`).
8. Redeploy the frontend. Done.

**Free tier note:** CPU Spaces sleep after a period of inactivity and take
~30-60s to wake on the next request. The route handler already accounts for
this with a friendly error + generous timeout. If that cold-start delay is a
problem for real users, Spaces support paid "always-on" upgrades.

### Option B — ngrok (fast, temporary — good for testing today)

Use this to prove the fix works right now, or for a demo, while you set up
Spaces properly.

1. On the machine where Flask + the model already run successfully (per
   your log), install ngrok and authenticate (one-time):
   ```bash
   ngrok config add-authtoken <your-token-from-ngrok.com>
   ```
2. Start your Flask server as usual, then in another terminal:
   ```bash
   ngrok http 5000
   ```
3. ngrok prints a public HTTPS URL like `https://a1b2c3d4.ngrok-free.app`.
4. Set:
   ```
   MODEL_API_URL=https://a1b2c3d4.ngrok-free.app/predict
   ```
5. Same Next.js route/component changes as steps 7-8 above.

Caveats: the URL changes every time you restart ngrok (free plan), and your
PC + Flask server must stay running and online the whole time anyone might
use the site. Treat this as a bridge to Option A, not a replacement for it.

## Files in this delivery

```
model-api/                          → deploy this folder to Hugging Face Spaces
  app.py                            → Flask API (/health, /predict) — tested, working
  Dockerfile                        → tested Docker build config for Spaces
  requirements.txt                  → pinned, conflict-free versions
  README.md                         → Space's own README incl. HF metadata header
  .dockerignore

nextjs-integration/
  app/api/predict/route.ts          → proxy route — tested, working end-to-end
  UPDATE_YOUR_UPLOAD_COMPONENT.ts   → the one-line change for your existing upload UI
  .env.local.example                → replaces the hardcoded 127.0.0.1 line
```

## About the placeholder model

`app.py` expects a `model.keras` file with **3 inputs, each (224, 224, 3)**
— that's the exact signature your own `model.log` reported, so the API
contract (request → 3 preprocessed copies of the uploaded image → predict →
JSON) matches your real model's shape. It assumes all three branches were
trained on identically-preprocessed images; if your training used different
per-branch preprocessing (e.g. a different `preprocess_input` per backbone),
adjust the `preprocess()` function in `app.py` accordingly — it's one small,
clearly-commented function.

I tested the whole pipeline with a tiny dummy model sharing that same input
shape (to prove the Flask app, Docker setup, and Next.js proxy all work
together correctly) — swap in your real `model.keras` and everything else
stays the same.
