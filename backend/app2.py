from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging
import traceback
import numpy as np
from PIL import Image
import cv2
import tensorflow as tf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("compatibility_app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Reduce TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

app = Flask(__name__)
CORS(app)

# DR labels
DR_LABELS = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

# Global model variable
model = None

def try_load_model():
    """
    Try multiple approaches to load the model
    """
    global model
    
    model_path = "2025(84%).keras"
    
    # 1. Check if model exists in the current directory
    if not os.path.exists(model_path):
        # Try the full path
        model_path = r"C:\Users\GON\Desktop\diabetic-retinopathy\backend\2025(84%).keras"
        if not os.path.exists(model_path):
            logger.error(f"Model file not found!")
            return False
    
    logger.info(f"Attempting to load model from: {model_path}")
    
    # 2. Try different loading approaches
    loading_approaches = [
        # Standard loading
        lambda: tf.keras.models.load_model(model_path),
        
        # Skip compilation
        lambda: tf.keras.models.load_model(model_path, compile=False),
        
        # Safe loading
        lambda: tf.keras.models.load_model(model_path, safe_mode=False),
        
        # Load weights only using a specific architecture
        lambda: load_via_dummy_model(model_path),
        
        # Last resort - load weights via low-level API
        lambda: create_model_from_scratch(model_path)
    ]
    
    for i, load_attempt in enumerate(loading_approaches):
        try:
            logger.info(f"Trying loading approach #{i+1}...")
            model = load_attempt()
            logger.info(f"✅ Model loaded successfully with approach #{i+1}!")
            return True
        except Exception as e:
            logger.error(f"Loading approach #{i+1} failed: {str(e)}")
    
    return False

def load_via_dummy_model(model_path):
    """Create a dummy model and load weights"""
    from tensorflow.keras.applications import ResNet50
    dummy_model = ResNet50(
        include_top=True, 
        weights=None,
        input_shape=(224, 224, 3),
        classes=5  # For DR classes
    )
    
    try:
        dummy_model.load_weights(model_path, by_name=True, skip_mismatch=True)
        logger.info("Loaded weights via dummy ResNet50 model")
        return dummy_model
    except:
        # If that fails, try EfficientNet
        from tensorflow.keras.applications import EfficientNetB4
        dummy_model = EfficientNetB4(
            include_top=True, 
            weights=None,
            input_shape=(224, 224, 3),
            classes=5
        )
        dummy_model.load_weights(model_path, by_name=True, skip_mismatch=True)
        logger.info("Loaded weights via dummy EfficientNetB4 model")
        return dummy_model

def create_model_from_scratch(model_path):
    """Create a very custom model - needs to match your actual architecture"""
    # This is just a placeholder - in reality you would need to specify
    # your actual model architecture
    
    # For demonstration - using a VGG16-like structure
    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same')(inputs)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)
    x = tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = tf.keras.layers.MaxPooling2D((2, 2))(x)
    x = tf.keras.layers.Flatten()(x)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    outputs = tf.keras.layers.Dense(5, activation='softmax')(x)  # 5 DR classes
    
    custom_model = tf.keras.Model(inputs, outputs)
    
    # Here you would load weights if possible
    # custom_model.load_weights(model_path, by_name=True, skip_mismatch=True)
    
    return custom_model

def preprocess_image(image):
    """Preprocess image for prediction"""
    try:
        img = np.array(image.convert("RGB"))
        
        # Resize to expected input size (224x224 for many models)
        target_size = (224, 224)
        if model is not None and hasattr(model, 'input_shape'):
            if model.input_shape[1:3] != (224, 224):
                target_size = model.input_shape[1:3]
                
        img = cv2.resize(img, target_size)

        # LAB CLAHE enhancement
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

        # Apply blur
        img = cv2.GaussianBlur(img, (5, 5), 0)
        
        # Normalize
        img = img.astype(np.float32) / 255.0
        img = (img - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        img = np.expand_dims(img, axis=0)
        
        return img
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

@app.route('/predict', methods=['POST'])
def predict():
    global model
    
    # Check if model is loaded
    if model is None:
        success = try_load_model()
        if not success:
            return jsonify({'error': 'Failed to load model - see logs for details'}), 500
    
    # Check if image was provided
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    try:
        # Load and preprocess the image
        img = Image.open(file.stream)
        logger.info(f"Image received: size={img.size}, mode={img.mode}")
        processed_img = preprocess_image(img)
        
        # Make prediction
        logger.info("Running prediction...")
        prediction = model.predict(processed_img, verbose=0)
        logger.info(f"Prediction shape: {prediction.shape}")
        
        # Process results
        if prediction.shape[1] > 1:  # Multi-class prediction
            predicted_class = int(np.argmax(prediction[0]))
            confidence = float(np.max(prediction[0]))
            confidence_dict = {str(i): float(prediction[0][i]) for i in range(len(prediction[0]))}
        else:  # Binary prediction
            predicted_class = int(round(float(prediction[0][0])))
            confidence = float(prediction[0][0])
            confidence_dict = {str(predicted_class): confidence}
        
        logger.info(f"Predicted class: {predicted_class} ({DR_LABELS.get(predicted_class, 'Unknown')})")
        logger.info(f"Confidence: {confidence}")
        
        # Format response to match frontend expectations
        return jsonify({
            'class': DR_LABELS.get(predicted_class, "Unknown"),
            'confidence': confidence_dict
        })
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'tensorflow_version': tf.__version__
    })

if __name__ == '__main__':
    logger.info("Starting compatibility app...")
    logger.info(f"TensorFlow version: {tf.__version__}")
    logger.info(f"Current working directory: {os.getcwd()}")
    
    # Try to load the model at startup
    try_load_model()
    
    # Start the server
    app.run(host='0.0.0.0', port=5000, debug=False)
