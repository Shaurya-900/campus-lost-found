# Campus Lost & Found

AI-powered lost and found system for campus using computer vision to automatically match lost and found items.

## Live Demo

**Frontend & API:** https://campus-lost-found-serverless.vercel.app

## Features

- **AI Image Analysis** - Google Gemini Vision API extracts item characteristics
- **Automatic Matching** - Weighted word-overlap algorithm matches lost items with found items based on AI-extracted tags (type, color, material, brand), robust to Gemini's non-deterministic phrasing
- **Persistent Storage** - Turso cloud SQLite database ensures data persists across deployments
- **Real-time Matching** - See all matches instantly with confidence scores
- **Simple Interface** - Report lost/found items in under a minute

## Tech Stack

**Frontend**
- React 18
- Vite
- TailwindCSS

**Backend**
- Node.js (Serverless functions)
- Google Gemini 2.5 Flash Vision API

**Database**
- Turso (Cloud SQLite)

**Deployment**
- Vercel (Frontend + Backend)

## How It Works

1. User uploads photo of lost or found item
2. Gemini Vision API analyzes image and extracts key features (type, color, material, brand, condition)
3. Matching algorithm compares features with opposite-type items in database
4. System returns top matches with confidence percentage (50%+ threshold)
5. Users can view all matches on dedicated matches page

## Local Development

### Prerequisites
- Node.js 18+
- Google Gemini API key - [Get one here](https://aistudio.google.com/app/apikey)
- Turso account - [Sign up here](https://turso.tech)

### Database Setup

1. Create Turso database:
```bash
turso auth login
turso db create campus-lost-found
turso db shell campus-lost-found
```

2. Create tables:
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  image_base64 TEXT NOT NULL,
  location TEXT NOT NULL,
  note TEXT,
  ai_tags TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY,
  lost_id INTEGER NOT NULL,
  found_id INTEGER NOT NULL,
  confidence INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
```

3. Get connection credentials:
```bash
turso db tokens create campus-lost-found
turso db show campus-lost-found --json
```

### Backend Setup
```bash
npm install
```

Create `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
TURSO_CONNECTION_URL=your_turso_url_here
TURSO_AUTH_TOKEN=your_turso_token_here
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Deployment

### Vercel Setup

1. Connect GitHub repository
2. Add environment variables:
   - `GEMINI_API_KEY` - Your Google AI Studio API key
   - `GEMINI_MODEL` - `gemini-2.5-flash`
   - `TURSO_CONNECTION_URL` - Your Turso connection URL
   - `TURSO_AUTH_TOKEN` - Your Turso auth token
   - `VITE_API_URL` - Your deployed Vercel URL with `/api` suffix

3. Build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/dist`

4. Deploy

## Project Structure
```
campus-lost-found/
├── api/                       # Vercel serverless functions
│   ├── health.js             # Health check
│   ├── report.js             # Submit lost/found item
│   ├── matches.js            # Get all matches
│   └── items.js              # Get all items
├── lib/                       # Shared utilities
│   ├── database.js           # Turso database client
│   ├── gemini.js             # Google Gemini Vision integration
│   └── matcher.js            # Matching algorithm
├── frontend/                  # React application
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── ReportForm.jsx    # Lost/found item form
│   │   ├── Matches.jsx       # Matches display
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
├── vercel.json               # Vercel configuration
└── README.md
```

## API Endpoints
```
GET  /api/health             # Health check
POST /api/report             # Submit lost/found item
GET  /api/matches            # Get all matches
GET  /api/items              # Get all items
```

## Matching Algorithm

Scores are built from weighted Jaccard word-overlap on Gemini's tags, not exact string matching — so "assortment of pastries and donuts" still matches "assorted pastries and donuts":
- Item type overlap: up to 45 points
- Color overlap: up to 25 points
- Material overlap: up to 15 points
- Brand: 15 points if both items name the same brand
- Location: 10 point bonus if both items report the same location

Blank/"unknown" fields are ignored entirely (no false matches from missing info). Matches above 50% confidence are shown to users.

## Future Enhancements

- User authentication and contact information
- Email notifications for high-confidence matches
- Advanced search and filtering
- Mobile app
- Admin dashboard for moderation
- SMS notifications

## License

MIT License - 2026 Shaurya Jain

## Contact

Built by Shaurya Jain - B.Tech CSE, Shiv Nadar University

GitHub: [Shaurya-900](https://github.com/Shaurya-900)