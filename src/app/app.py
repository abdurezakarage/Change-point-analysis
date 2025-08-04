from flask import Flask, jsonify
from flask_cors import CORS
from routes.analysis import bp as analysis_bp
import os

app = Flask(__name__)

# Configure CORS for React frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001","https://brent-oil.vercel.app"])

# Register blueprints
app.register_blueprint(analysis_bp)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"error": str(e)}), 500

# Health check endpoint
@app.route("/oil")
def oil_check():
    return jsonify({"status": "oil", "service": "Brent Oil Analysis API"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
