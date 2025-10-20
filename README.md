# Smart Hospital Management System

A comprehensive hospital management system with patient portal, appointment booking, and administrative features.

## Project Structure

```
smart-hospital/
├── my-next-app/          # Frontend (Next.js)
├── backend/              # Backend (Python Flask)
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Python Flask 2.3.3** - Web framework
- **SQLAlchemy** - ORM
- **MySQL** - Database
- **Flask-JWT-Extended** - Authentication
- **Flask-CORS** - Cross-origin requests
- **bcrypt** - Password hashing

## Features

### Patient Portal
- Patient registration with auto-generated OPD ID
- Secure authentication with JWT tokens
- Dashboard with appointment overview
- Book new appointments
- View appointment history
- Queue status tracking
- Notifications center
- Profile settings
- Card management

### API Endpoints
- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/profile`
- **Patients**: `/api/patients/`, `/api/patients/<id>`
- **Appointments**: `/api/appointments/`, `/api/appointments/book`

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- MySQL 8.0+

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd my-next-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   ```bash
   # Create .env file in backend folder
   FLASK_APP=app.py
   FLASK_ENV=development
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   DATABASE_URL=mysql://username:password@localhost/smart_hospital
   ```

6. Create MySQL database:
   ```sql
   CREATE DATABASE smart_hospital;
   ```

7. Start the Flask server:
   ```bash
   python app.py
   ```

8. API will be available at [http://localhost:5000](http://localhost:5000)

### Database Setup

1. Ensure MySQL is running
2. Create database: `smart_hospital`
3. The Flask app will create tables automatically on first run
4. Tables created:
   - `patients` - Patient information and credentials
   - `appointments` - Appointment bookings and status

## Development

### Frontend Development
- Pages are in `my-next-app/app/`
- Components are in `my-next-app/app/components/`
- Shared patient layout at `my-next-app/app/patient/layout.tsx`

### Backend Development
- Flask app factory in `backend/app/__init__.py`
- Models in `backend/app/models/`
- Routes in `backend/app/routes/`
- Configuration in `backend/config/config.py`

### Running Both Services
1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd my-next-app && npm run dev`
3. Frontend connects to backend API automatically

## API Documentation

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St",
  "date_of_birth": "1990-01-01",
  "gender": "Male"
}
```

**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**GET /api/auth/profile**
- Requires JWT token in Authorization header

### Appointment Endpoints

**POST /api/appointments/book**
```json
{
  "doctor_name": "Dr. Smith",
  "department": "Cardiology",
  "preferred_date": "2024-01-15",
  "preferred_time": "10:00",
  "reason": "Regular checkup"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/yourusername/smart-hospital](https://github.com/yourusername/smart-hospital)