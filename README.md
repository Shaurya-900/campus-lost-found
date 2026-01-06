# Campus Lost & Found - Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Google Gemini API key

## Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file as per the `.env.example`:
```
GEMINI_API_KEY=YOUR_API_KEY_HERE
PORT=3001
GEMINI_MODEL=gemini-2.5-flash
```

4. Get your Gemini API key:
- Go to https://aistudio.google.com/app/apikey
- Create a new API key
- Paste it in `.env`

5. Start backend:
```bash
npm start
```

Backend runs on http://localhost:3001

## Frontend Setup

1. Open NEW terminal, navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend:
```bash
npm run dev
```

Frontend runs on http://localhost:3000

## Usage

1. Open http://localhost:3000
2. Click "I Lost Something" or "I Found Something"
3. Upload an image, select location, submit
4. AI will analyze the image and find matches
5. View all matches from homepage

##