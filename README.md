# EduAI Assistant

An AI-powered learning platform where students can upload PDFs, ask questions, get summaries, and generate quizzes — powered by Google Gemini.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **AI:** Google Gemini API (gemini-1.5-flash)
- **Auth:** JWT + bcrypt

## Setup

### 1. Backend

```bash
cd server
npm install
```

Edit `server/.env` and set your values:

```
PORT=5000
MONGODB_URI=mongodb+srv://...your-connection-string...
JWT_SECRET=change_this_to_a_random_string
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to the backend on port 5000.

## Features

- User registration and login with JWT auth
- Upload PDF documents (max 10MB)
- Ask AI questions about uploaded documents
- Generate AI summaries of documents
- Generate interactive quizzes from documents
- View full interaction history
- Dark mode toggle
- Fully responsive design
