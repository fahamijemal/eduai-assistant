# EduAI Assistant 2.0

**AI Learning Intelligence System** -- An adaptive learning platform powered by Google Gemini AI.

EduAI goes beyond simple document Q&A. It acts as an AI Learning Coach that understands study behavior, tracks topic mastery, detects weaknesses, predicts exam readiness, and automatically adjusts learning strategies.

## Features

- **Cross-Document Reasoning** -- Ask questions across multiple PDFs, compare documents, detect contradictions
- **Topic Extraction Engine** -- Automatically extract hierarchical topic trees from study materials
- **Mastery Scoring System** -- Track accuracy, confidence, and improvement trends per topic
- **Weakness Detection** -- Identify frequently incorrect topics, slow responses, repeated misunderstandings
- **Exam Readiness Predictor** -- 0-100 readiness score with pass probability and focus area recommendations
- **Smart Revision Scheduler** -- Spaced repetition logic that generates daily micro-study plans
- **Adaptive Quiz Engine** -- Dynamically generated quizzes targeting weak areas with adjustable difficulty
- **Learning Analytics Dashboard** -- Study time graphs, mastery radar charts, performance trends
- **Study Session Tracking** -- Auto-tracks study time with heartbeat, streak tracking
- **Dark Mode** -- Full dark/light theme toggle with system preference detection
- **Markdown AI Responses** -- Rich markdown rendering for AI chat, summaries, and comparisons

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, Recharts |
| Backend | Express.js, Node.js (ES Modules) |
| AI | Google Gemini 2.5 Flash |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone and install

```bash
git clone <repo-url>
cd cursorcoffe
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and set your values:

```
MONGO_URI=mongodb://localhost:27017/eduai
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run development servers

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 5173) concurrently.

### 4. Run tests

```bash
npm test --workspace=backend
```

## Deployment

### Option A: Docker (recommended)

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your-key
export JWT_SECRET=your-secure-secret

# Build and run
docker-compose up --build
```

The app will be available at `http://localhost:5000`.

### Option B: Vercel (frontend) + Railway/Render (backend)

**Frontend on Vercel:**

1. Connect your GitHub repo to Vercel
2. Set the root directory to `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.railway.app/api`

**Backend on Railway/Render:**

1. Connect your GitHub repo
2. Set the root directory to `backend`
3. The `Procfile` is already configured: `web: node src/server.js`
4. Add environment variables:
   - `NODE_ENV=production`
   - `MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/eduai`
   - `JWT_SECRET=your-secure-secret`
   - `GEMINI_API_KEY=your-gemini-api-key`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`

### Option C: MongoDB Atlas (database)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user and whitelist your IP (or use `0.0.0.0/0` for cloud deploys)
3. Copy the connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/eduai`
4. Set it as `MONGO_URI` in your backend environment

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user profile |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF (max 10MB) |
| GET | `/api/documents` | List user documents |
| GET | `/api/documents/:id` | Get document details |
| GET | `/api/documents/:id/text` | Extract document text |
| DELETE | `/api/documents/:id` | Delete document |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/ask` | Ask question against documents |
| POST | `/api/ai/summarize` | Summarize a document |
| POST | `/api/ai/compare-documents` | Cross-document comparison |
| POST | `/api/ai/extract-topics` | Extract topic hierarchy |
| POST | `/api/ai/generate-quiz` | Generate adaptive quiz |
| POST | `/api/ai/submit-quiz` | Submit quiz answers |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/mastery` | Topic mastery scores |
| GET | `/api/analytics/weak-topics` | Weak topics + patterns |
| GET | `/api/analytics/exam-readiness` | Exam readiness prediction |
| GET | `/api/analytics/study-time` | Study time analytics |
| GET | `/api/analytics/performance-trend` | Performance over time |
| GET | `/api/analytics/revision-plan` | Smart daily revision plan |
| POST | `/api/analytics/study-session/start` | Start a study session |
| POST | `/api/analytics/study-session/end` | End a study session |

## Project Structure

```
cursorcoffe/
├── backend/
│   └── src/
│       ├── server.js              # Express entry point
│       ├── config/                # Configuration
│       ├── db/                    # Database connection
│       ├── middleware/            # Auth, upload, rate limit, validation
│       ├── models/                # Mongoose schemas (6 models)
│       ├── routes/                # API route definitions
│       ├── controllers/           # Request handlers
│       ├── services/              # Business logic
│       │   ├── aiService.js                  # Gemini API wrapper
│       │   ├── pdfService.js                 # PDF text extraction
│       │   ├── topicExtractionService.js     # Topic hierarchy extraction
│       │   ├── masteryService.js             # Mastery scoring engine
│       │   ├── weaknessDetectionService.js   # Weakness pattern detection
│       │   ├── examReadinessService.js       # Exam readiness predictor
│       │   ├── revisionSchedulerService.js   # Spaced repetition scheduler
│       │   └── quizService.js                # Adaptive quiz engine
│       └── utils/                 # JWT helpers
├── frontend/
│   └── src/
│       ├── components/            # UI components (shadcn-style)
│       ├── context/               # Auth + Theme contexts
│       ├── hooks/                 # useStudyTimer
│       ├── lib/                   # API client, utilities
│       └── pages/                 # Application pages
│   └── vercel.json               # Vercel SPA rewrite rules
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Built At

**Cafe Cursor Adama** -- February 14, 2026, 1:37 PM GMT+3

This project was built at Cafe Cursor, a community meetup for builders, creators, and tech enthusiasts hosted by the [Cursor Community](https://cursor.com/community) in Adama, Ethiopia.

Hosted by Alpha Lencho, Mahlet Asrat Tefera, Aman Tesfahunagen, Zufan Gebrehiwot, and Hewan Sirak.

Kottaa Buna Dhugaa! ☕

## License

MIT
