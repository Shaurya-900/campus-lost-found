# Campus Lost & Found

AI-powered lost and found system for campus using computer vision to automatically match lost and found items.

## Live Demo

**Frontend:** https://campus-lost-found-beta.vercel.app  
**Backend API:** https://campus-lost-found-production.up.railway.app/api/health

## Features

- **AI Image Analysis** - Google Gemini Vision API extracts item features (type, color, material, brand)
- **Automatic Matching** - Smart algorithm matches lost items with found items based on visual similarity
- **Real-time Updates** - See all matches instantly with confidence scores
- **Simple Interface** - Report lost/found items in under a minute

## Tech Stack

**Frontend**
- React 18
- Vite
- TailwindCSS

**Backend**
- Node.js
- Express
- Google Gemini 2.0 Flash Vision API

**Deployment**
- Frontend: Vercel
- Backend: Railway
- Database: JSON-based storage (SQLite migration in progress)

## How It Works

1. User uploads photo of lost or found item
2. Gemini Vision API analyzes image and extracts key features
3. Matching algorithm compares features with opposite-type items
4. System returns top matches with confidence percentage
5. Users can view all matches on dedicated matches page

## Local Development

### Prerequisites
- Node.js 18+
- Google Gemini API key - [Get one here](https://aistudio.google.com/app/apikey)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```
GEMINI_API_KEY=your_api_key_here
PORT=3001
GEMINI_MODEL=gemini-2.5-flash
```

Start server:
```bash
npm start
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Deployment

### Backend (Railway)

1. Connect GitHub repository
2. Set root directory to `/backend`
3. Configure environment variables:
   - `GEMINI_API_KEY` - Your Google AI Studio API key
   - `FRONTEND_URL` - Your Vercel deployment URL (or `*` for development) 
   - `PORT` - 3001 (or leave empty for Railway auto-assignment)
4. Deploy

### Frontend (Vercel)

1. Connect GitHub repository
2. Set root directory to `/frontend`
3. Build command: `npm run build`
4. Configure environment variable:
   - `VITE_API_URL` - `https://your-railway-url.up.railway.app/api`
5. Deploy

## Project Structure

```
campus-lost-found/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── database.js        # JSON-based data persistence
│   ├── gemini.js          # Google Gemini Vision integration
│   ├── matcher.js         # Matching algorithm logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── ReportForm.jsx # Lost/Found item submission form
│   │   ├── Matches.jsx    # Match display component
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## API Endpoints

```
GET  /api/health          # Health check
POST /api/report          # Submit lost/found item
GET  /api/matches         # Get all matches
GET  /api/items           # Get all items
```

## Matching Algorithm

The system uses a weighted scoring algorithm:
- Item type match: 40 points
- Color match: 25 points
- Material match: 15 points
- Brand match: 20 points
- Location proximity bonus: 10 points

Matches above 50% confidence threshold are displayed to users.

## Roadmap

- Migrate to SQLite for persistent storage on Railway
- Add user authentication and contact information
- Implement email notifications for high-confidence matches
- Add search and filter functionality
- Mobile-responsive improvements
- Admin dashboard for moderation

## Known Issues

- Database resets on Railway restart (JSON file-based storage limitation)
- Large image uploads may timeout on free-tier hosting
- Gemini API rate limits apply to free tier

## License

MIT License - 2026 Shaurya Jain

## Contact

Built by Shaurya Jain - B.Tech CSE, Shiv Nadar University

GitHub: [Shaurya-900](https://github.com/Shaurya-900)