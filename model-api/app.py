import os
import io
import time
import logging
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
tf.get_logger().setLevel("ERROR")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("model-api")

app = Flask(__name__)
CORS(app)

# Equal-weight ensemble of 3 EfficientNet checkpoints. Measured on 200 labeled
# training images: dr_model_working 64.0%, dr_model_2 58.0%, dr_model_3 65.5%,
# equal-weight average of all 3: 70.0% (best - used here).
MODEL_FILES = ["dr_model_working.keras", "dr_model_2.keras", "dr_model_3.keras"]
DR_LABELS = {0: "No DR", 1: "Mild", 2: "Moderate", 3: "Severe", 4: "Proliferative DR"}

models = []
model_load_seconds = None


class NotARetinaImageError(Exception):
    pass


def load_models():
    global models, model_load_seconds
    t0 = time.time()
    for fname in MODEL_FILES:
        if not os.path.exists(fname):
            raise FileNotFoundError(f"Model file not found: {fname}")
        log.info("Loading ensemble member: %s", fname)
        m = tf.keras.models.load_model(fname, compile=False)
        log.info("Loaded %s. input_shape=%s", fname, m.input_shape)
        models.append(m)
    model_load_seconds = time.time() - t0
    log.info("All %d ensemble members loaded in %.1fs.", len(models), model_load_seconds)


def check_looks_like_retina(image):
    # Two independent signals, both measured against 50 real training images:
    # 1. Color: fundus photos are red-dominant with low blue (R ratio 0.36-0.72,
    #    B ratio never above 0.30).
    # 2. Vignette: fundus photos are circular crops on a black background, so all
    #    four corners are almost entirely black (93-100% dark pixels, every real
    #    image). Very hard for a random photo to satisfy by accident.
    rgb = np.array(image.convert("RGB"), dtype=np.float32)
    mean_r, mean_g, mean_b = rgb[..., 0].mean(), rgb[..., 1].mean(), rgb[..., 2].mean()
    total = mean_r + mean_g + mean_b + 1e-6
    r_ratio = mean_r / total
    b_ratio = mean_b / total
    color_ok = r_ratio >= 0.35 and b_ratio <= 0.32

    gray = np.array(image.convert("L"), dtype=np.float32)
    h, w = gray.shape
    ch, cw = max(1, int(h * 0.12)), max(1, int(w * 0.12))
    corners = np.concatenate([
        gray[:ch, :cw].flatten(), gray[:ch, -cw:].flatten(),
        gray[-ch:, :cw].flatten(), gray[-ch:, -cw:].flatten(),
    ])
    vignette_ok = (corners < 30).mean() >= 0.85

    if not (color_ok and vignette_ok):
        raise NotARetinaImageError(
            "This doesn't look like a retinal fundus photo. Please upload a clear retina scan image."
        )


def preprocess_for(image, model):
    # Each ensemble member expects raw, unnormalized 0-255 pixel values
    # (verified empirically) - only the resize target differs per model.
    target_h, target_w = model.input_shape[1:3]
    img = np.array(image.convert("RGB"))
    img = cv2.resize(img, (target_w, target_h)).astype(np.float32)
    return np.expand_dims(img, axis=0)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if models else "model_not_loaded",
        "model_load_seconds": model_load_seconds,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if not models:
        return jsonify({"error": "Model is not loaded yet. Check /health."}), 503

    file = request.files.get("image") or request.files.get("file")
    if file is None:
        return jsonify({"error": "No image provided. Send multipart/form-data with field 'image'."}), 400

    try:
        image = Image.open(io.BytesIO(file.read()))
        check_looks_like_retina(image)
        probs = [m.predict(preprocess_for(image, m), verbose=0)[0] for m in models]
    except NotARetinaImageError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        log.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    avg = np.mean(probs, axis=0)
    predicted_class = int(np.argmax(avg))
    return jsonify({
        "class": DR_LABELS.get(predicted_class, "Unknown"),
        "confidence": {str(i): float(p) for i, p in enumerate(avg)},
    })


load_models()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 7860)))
