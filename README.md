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

### Docker Deployment

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your-key

# Build and run
docker-compose up --build
```

The app will be available at `http://localhost:5000`.

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
│       ├── context/               # Auth context
│       ├── lib/                   # API client, utilities
│       └── pages/                 # Application pages
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Built At

**Cafe Cursor Adama** -- February 14, 2026

This project was built at Cafe Cursor, a community meetup for builders, creators, and tech enthusiasts hosted by the [Cursor Community](https://cursor.com/community) in Adama, Ethiopia.

Hosted by Alpha Lencho, Mahlet Asrat Tefera, Aman Tesfahunagen, Zufan Gebrehiwot, and Hewan Sirak.

Kottaa Buna Dhugaa! ☕

## License

MIT
