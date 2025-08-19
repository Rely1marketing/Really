# Really.ai MVP

Minimal chat-first prototype with a Next.js frontend, Node/Express backend and MongoDB.

## Configuration

1. Copy environment examples:
   ```
   cp .env.local.example .env.local
   cp frontend/.env.local.example frontend/.env.local
   ```
2. Fill in the values:
   - `OPENAI_API_KEY` – your OpenAI key
   - `OPENAI_MODEL` – model name (default `gpt-4o`)
   - `MONGO_URI` – Mongo connection string
   - `PORT` – backend port (default `3001`)
   - `BACKEND_URL` (frontend) – URL to the backend server

## Running

- `npm run dev` – starts backend and frontend development servers
- `npm run seed` – populate Mongo with demo data

## Testing

- `cd server && npm test`
- `cd frontend && npm test`
- `pytest`
