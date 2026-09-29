# Fit Matrix — AI-Powered Fitness Coach & Health Advisor

Fit Matrix is a full-stack fitness platform that combines a React frontend, an Express/TypeScript backend, and a Python ML microservice to provide personalized nutrition guidance, workout planning, squad-based engagement, and AI-assisted health recommendations.

This project is designed around a user-first fitness dashboard with onboarding, habit tracking, progress analytics, meal planning, workout routines, AI chatbot support, and team/challenge features.

## Project Overview

The application is organized into three main parts:

- Frontend: React + TypeScript + Vite single-page app
- Backend: Express + TypeScript REST API with authentication and application logic
- ML Service: Python microservice for model-based fitness and nutrition analysis

Together they create an AI-powered ecosystem for:

- fitness onboarding and profile tracking
- daily nutrition and hydration logging
- workout recommendations
- AI chatbot guidance for meals, workouts, and health questions
- product/food label scanning support
- social squad features and challenge flows
- streak and XP-based motivation mechanics

## Key Features

### User Experience

- Secure login and registration flow
- Onboarding with fitness goals, diet preference, activity levels, and personal health data
- Dashboard for daily progress and task completion
- Meal planning and nutrition-related pages
- Workout tracking and exercise recommendations
- Analytics and personal progress views
- Settings and profile updates
- Password reset and OTP-based recovery flow

### AI and ML Capabilities

- Chatbot integration with Gemini fallback logic
- ML service integration for food/workout classification and recommendation support
- Product and food analysis handling through the backend bridge
- Local fallback logic when AI/ML dependencies are unavailable

### Social and Wellness Features

- Squad creation and join flows
- Invitation handling
- Challenge tracking
- Streak management and motivation logic
- XP and progress rules for daily activity

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Framer Motion
- Lucide icons

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL support with a robust in-memory fallback
- JWT authentication
- bcrypt password hashing
- cookie-based sessions
- Nodemailer for OTP emails

### ML Service

- Python
- Starlette / Fast API-style server patterns
- scikit-learn
- XGBoost
- joblib
- NumPy / Pandas
- Pillow for image-related processing
- sentence-transformers

## Repository Structure

```text
.
├── README.md
├── DEPLOYMENT.md
├── package.json
├── backend/
│   ├── app.ts
│   ├── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── README.md
│   └── src/
├── ml_service/
│   ├── app.py
│   ├── chatbot_engine.py
│   ├── requirements.txt
│   ├── scripts/
│   └── tests/
├── my-react-app/
│   └── ...
└── validate_chat_upload.py
```

## Architecture

The system follows a modular design:

1. Frontend pages render user dashboards and application views.
2. The backend exposes REST APIs for auth, onboarding, chatbot requests, food/workout logic, and social features.
3. The backend checks readiness for both PostgreSQL and the ML service.
4. The ML service loads trained joblib models and provides prediction endpoints used by the backend.
5. Gemini is used when a valid API key exists, while the project also supports local fallback responses.

## Main Backend API Areas

The backend mounts these route groups:

- `/api/auth` — register, login, onboarding, profile retrieval, password reset
- `/api/chatbot` — AI chat and ML-assisted food/workout analysis
- `/api/streak` — daily tasks, progress logging, streak logic
- `/api/squad` — squad, invite, challenge, and member management

Health endpoints:

- `GET /api/health`
- `GET /api/ready`

## Environment Configuration

The project expects environment variables for database and service connectivity. The backend loads `.env` files from common project paths, and the code also references values like:

- `DATABASE_URL` / `DB_*`
- `JWT_SECRET` / `JWT_SECRET_KEY`
- `GEMINI_API_KEY`
- `ML_SERVICE_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN`

A typical local setup is to create a `.env` file in the project root or backend directory and populate the required values before running the app.

## Prerequisites

Before starting the project, make sure you have:

- Node.js 18+ or newer
- npm
- Python 3.10+
- PostgreSQL (optional if the local fallback is acceptable for development)
- A valid Gemini API key if you want production-like AI responses

## Installation

From the project root:

```bash
npm install
```

Install backend dependencies:

```bash
npm install --prefix backend
```

Install frontend dependencies:

```bash
npm install --prefix frontend
```

Install ML dependencies:

```bash
python -m pip install -r ml_service/requirements.txt
```

## Running the Project

### 1) Start the ML service

```bash
npm run start:ml
```

This runs the Python microservice from the `ml_service` directory and serves ML endpoints on port `8001` by default.

### 2) Start the backend server

```bash
npm start
```

This starts the Node/Express backend from the `backend` package and uses the compiled app entry.

### 3) Start the frontend

```bash
npm --prefix frontend run dev
```

The frontend is typically available on port `5173` in Vite development mode.

## Build Commands

### Full project build

```bash
npm run build
```

This runs backend TypeScript compilation and the frontend production build.

### Backend build

```bash
npm --prefix backend run build
```

### Frontend build

```bash
npm --prefix frontend run build
```

## Production Notes

The project contains a production deployment guide in [DEPLOYMENT.md](DEPLOYMENT.md). That file covers deployment flow, build expectations, and environment preparation.

The backend includes readiness checks for:

- database connectivity
- ML service connectivity

When the ML service is unavailable, the system has fallback logic for text-based chatbot interactions, while some AI-powered features may be degraded.

## Development Notes

This project includes a local fallback mechanism for several services:

- In-memory data store for development and demo usage
- PostgreSQL fallback when database connectivity fails
- AI fallback response handling when Gemini is not configured
- Model fallback payloads when ML jobs cannot load properly

This makes the app more resilient during local testing and prototype development.

## Suggested Use Cases

- AI-powered daily nutrition planning
- Workout recommendation based on goals and profile
- Calorie, protein, hydration tracking
- User motivation through streaks and XP
- Social accountability with squads and challenges
- Health-focused assistant for Indian-style diet and fitness patterns

## Notes

This workspace appears to target a demo/development environment with realistic mock user data, seeded profiles, and resilience features. It is suitable for local prototyping, AI-assisted fitness coaching demonstrations, and extension into a production-ready health product.

## License

The backend package declares ISC, and the project is intended for workspace use and product experimentation unless otherwise specified by the repository owner.
