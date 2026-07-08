FROM python:3.10-slim

# Force stdout/stderr to be unbuffered so log messages (model loading progress,
# errors) show up in the Space's log viewer immediately instead of sitting in
# a buffer until it fills up or the process exits.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps opencv-python-headless needs for image I/O + color conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces (Docker SDK) routes external traffic to this port
EXPOSE 7860

# 1 worker: keeps a single copy of the model in memory (matters on free-tier RAM).
# --timeout is generous since first load / first predictions can be slow on CPU.
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "300", "--capture-output", "--log-level", "info", "app:app"]
