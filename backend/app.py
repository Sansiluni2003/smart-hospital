import sys
import os

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from flask import jsonify

app = create_app()

@app.route('/')
def health_check():
    return jsonify({
        'message': 'Smart Hospital API is running',
        'status': 'healthy',
        'version': '1.0.0'
    })

@app.route('/api/health')
def api_health():
    return jsonify({
        'status': 'healthy',
        'database': 'connected'
    })

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully!")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
    
    print("🚀 Starting Smart Hospital API...")
    print("📍 API URL: http://localhost:5000")
    print("🏥 Health Check: http://localhost:5000")
    print("📚 API Endpoints:")
    print("   - POST /api/auth/register")
    print("   - POST /api/auth/login")
    print("   - GET  /api/auth/profile")
    print("   - GET  /api/patients/")
    print("   - POST /api/appointments/")
    print("   - GET  /api/appointments/")
    
    app.run(host='0.0.0.0', port=5000, debug=True)