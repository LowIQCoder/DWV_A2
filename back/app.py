from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
packages = []

@app.route('/package', methods=['POST'])
def handle_package():
    data = request.get_json()
    
    # Validate batch format
    if not isinstance(data, list):
        return jsonify({'error': 'Expected array of packages'}), 400
    
    # Validate individual packages
    required = ['ip', 'latitude', 'longitude', 'timestamp', 'suspicious']
    for package in data:
        if not all(key in package for key in required):
            return jsonify({'error': 'Invalid package format'}), 400
    
    # Store all packages
    packages.extend(data)
    print(f"Received {len(data)} packages for timestamp {data[0]['timestamp']}")
    return jsonify({'status': 'success', 'received': len(data)}), 200

@app.route('/packages', methods=['GET'])
def get_packages():
    return jsonify(packages)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
