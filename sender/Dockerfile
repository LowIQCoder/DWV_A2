FROM python:3.9-slim
WORKDIR /app
COPY req.txt .
RUN pip install --no-cache-dir -r req.txt
COPY sender.py .
COPY data/ data/
CMD ["python", "sender.py"]
