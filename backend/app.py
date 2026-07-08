from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import logging
import time
import traceback
import os
from model import Model, NotARetinaImageError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - PID:%(process)d - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Allow only certain file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# DR labels
DR_LABELS = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

# Load model once at startup - with better error handling
model = None
try:
    logger.info("Current working directory: " + os.getcwd())
    logger.info("Looking for .keras files...")
    for file in os.listdir('.'):
        if file.endswith('.keras'):
            logger.info(f"Found .keras file: {file}")
    
    model = Model()
    logger.info("Model loaded successfully")
except Exception as e:
    tb = traceback.format_exc()
    logger.error(f"Failed to load model:\n{tb}")

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    logger.info("Received prediction request")

    if model is None:
        logger.warning("Model not loaded")
        return jsonify({'error': 'Model not loaded'}), 500

    if 'image' not in request.files:
        logger.warning("No image provided")
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if not allowed_file(file.filename):
        logger.warning("Invalid file type")
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        img = Image.open(file.stream)
        logger.info(f"Image received: {file.filename}, size: {img.size}")

        predict_start = time.time()
        predicted_class, confidence, confidence_dict = model.predict(img)
        predict_duration = time.time() - predict_start
        total_duration = time.time() - start_time

        logger.info(f"Prediction done in {predict_duration:.2f}s, total time: {total_duration:.2f}s")

        # Format the response to match frontend expectations
        return jsonify({
            'class': DR_LABELS.get(predicted_class, "Unknown"),  # Return the label as the class
            'confidence': confidence_dict  # Return confidence for all classes
        })
    except NotARetinaImageError as e:
        logger.warning(f"Rejected non-retina image: {file.filename}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error during prediction:\n{tb}")
        return jsonify({'error': 'Internal Server Error', 'trace': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'model_loaded': model is not None
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)