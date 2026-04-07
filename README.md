# Contract Analyzer

## What is Contract Analyzer?

Contract Analyzer is a free tool that helps everyday people understand the employment contracts they've been asked to sign. Legal documents can be confusing and full of jargon — this app breaks them down into plain language so you know exactly what you're agreeing to.

Upload your contract as a PDF, click on any section, and instantly get a simple explanation of what it means along with a list of things to watch out for. If you're in BC and need professional legal advice, there's also a built-in form to contact a lawyer directly.

**No legal background required. Just upload and ask.**

## Features

- Upload a PDF employment contract and view it in the browser
- Click on any section to send it for AI analysis
- Receive a plain-English summary of each section
- See a list of potential red flags identified in each section
- Lawyer contact form (BC-specific) for users who need professional help

## Tech Stack

**Frontend**
- React with TypeScript
- Tailwind CSS
- Vite (dev server on port 5173)

**Backend**
- Express.js (`server.js`)
- Anthropic Claude API for contract analysis
- Runs on port 3001

## Prerequisites

- Node.js (v18 or later recommended)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd contract-analyzer
```

### 2. Install dependencies

```bash
npm install --prefix frontend
npm install --prefix backend
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### 4. Start both services

In one terminal, start the backend:

```bash
cd backend
npm start
```

In another terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173). The frontend proxies AI analysis requests to the backend at port 3001.

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Your Anthropic API key, used by the Express server to call Claude |

## Available Scripts

### Frontend (`frontend/` directory)

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run Biome linting, formatting, and import sorting |

### Backend (`backend/` directory)

| Script | Description |
|---|---|
| `npm start` | Start the Express server with `node server.js` (port 3001) |
