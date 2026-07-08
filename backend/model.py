import os
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
import logging

# Reduce TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("model.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class NotARetinaImageError(Exception):
    """Raised when the uploaded image's color profile doesn't match a retinal fundus photo."""
    pass


# Equal-weight ensemble of 3 EfficientNet checkpoints, replacing the original
# 3-branch ensemble (2025(84%)_repaired.keras) whose classifier head proved
# unreliable (~95% "No DR" regardless of input, confirmed on 200 labeled
# training images). Measured on the same 200-image test set:
#   dr_model_working (best_eff_focal): 64.0%
#   dr_model_2 (final_eff_model):      58.0%
#   dr_model_3 (best_eff_b3):          65.5%
#   equal-weight average of all 3:     70.0%  <- best, used here
MODEL_FILES = ["dr_model_working.keras", "dr_model_2.keras", "dr_model_3.keras"]


class Model:
    def __init__(self, model_dir=None):
        self._configure_gpu()
        model_dir = model_dir or os.path.dirname(__file__) or "."

        self.models = []
        for fname in MODEL_FILES:
            path = os.path.join(model_dir, fname)
            if not os.path.exists(path):
                path = fname  # fall back to relative-to-cwd
            if not os.path.exists(path):
                raise FileNotFoundError(f"Ensemble member not found: {fname}")
            logger.info(f"Loading ensemble member: {path}")
            m = tf.keras.models.load_model(path, compile=False)
            logger.info(f"Loaded {fname}. Input shape: {m.input_shape}")
            self.models.append(m)

        logger.info(f"Model loaded successfully. {len(self.models)}-model ensemble ready.")

    def _configure_gpu(self):
        try:
            gpus = tf.config.experimental.list_physical_devices('GPU')
            if gpus:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                logger.info(f"GPU memory growth enabled for {len(gpus)} GPU(s)")
            else:
                logger.info("No GPU found, using CPU")
        except Exception as e:
            logger.warning(f"Error configuring GPU: {str(e)}")

    def _check_looks_like_retina(self, image):
        # Two independent signals, both measured against 50 real training images:
        #
        # 1. Color: fundus photos are red-dominant with low blue (R ratio 0.36-0.72,
        #    B ratio never above 0.30). Everyday photos (grass, sky, faces) usually fail this.
        #
        # 2. Vignette: fundus photos are circular crops on a black background, so all
        #    four corners are almost entirely black (measured: 93-100% dark pixels in
        #    every corner, every real image). This is very hard for a random photo to
        #    satisfy by accident - it requires ALL FOUR corners to be near-black at once.
        #    (A synthetic green/blue "football" test image scored 0% here.)
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

    def _preprocess_for(self, image, model):
        # Each ensemble member expects raw, unnormalized 0-255 pixel values
        # (verified empirically) - only the resize target differs per model.
        target_h, target_w = model.input_shape[1:3]
        img = np.array(image.convert("RGB"))
        img = cv2.resize(img, (target_w, target_h)).astype(np.float32)
        return np.expand_dims(img, axis=0)

    def predict(self, image):
        self._check_looks_like_retina(image)
        try:
            probs = []
            for m in self.models:
                batch = self._preprocess_for(image, m)
                probs.append(m.predict(batch, verbose=0)[0])

            avg = np.mean(probs, axis=0)
            predicted_class = int(np.argmax(avg))
            confidence = float(avg[predicted_class])
            confidence_dict = {str(i): float(p) for i, p in enumerate(avg)}

            logger.info(f"Prediction: Class {predicted_class}, Confidence: {confidence:.4f}")
            return predicted_class, confidence, confidence_dict
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise

if __name__ == "__main__":
    try:
        model = Model()
        print("Model initialized successfully")

        test_image_path = "test_image.jpg"
        if os.path.exists(test_image_path):
            img = Image.open(test_image_path)
            predicted_class, confidence, _ = model.predict(img)
            print(f"Test prediction: Class {predicted_class}, Confidence: {confidence:.4f}")
    except Exception as e:
        print(f"Error testing model: {str(e)}")
