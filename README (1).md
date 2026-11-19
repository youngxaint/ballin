# Enzo

An AI health assistant: a small TypeScript wrapper around Google Gemini.

## Setup

```bash
npm install
cp .env.example .env   # add your GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm run dev            # interactive CLI
npm run serve          # web chat at http://localhost:3000
```

## Use as a library

```ts
import { Enzo } from "./src/index.js";

const enzo = new Enzo({ apiKey: process.env.GEMINI_API_KEY! });

// One-shot
const { text } = await enzo.chat("user-123", "I've had a headache for 3 days.");

// Streaming
for await (const chunk of enzo.chatStream("user-123", "Should I see a doctor?")) {
  process.stdout.write(chunk);
}
```

Each `sessionId` keeps its own conversation history (in memory). Swap the `Map` in
`src/enzo.ts` for Redis or a database if you need persistence across restarts.

## Safety

- `src/safety.ts` checks every message for emergency and self-harm language before calling
  Gemini, and replies immediately with escalation guidance.
- The system prompt (`src/prompt.ts`) tells Enzo not to diagnose or prescribe and to flag
  when care is needed.
- Enzo gives general information only. Don't ship it without clear disclaimers, and review
  privacy rules (e.g. HIPAA/GDPR) before handling real patient data.

## Web API

`npm run serve` starts an Express server (`src/server.ts`) that serves the chat UI in `public/`.

- `POST /api/chat` with `{ "sessionId": "<8-64 chars>", "message": "..." }` streams the reply as plain text.
- `POST /api/reset` with `{ "sessionId": "..." }` clears that session.
- Messages are capped at 2000 characters, with a simple in-memory limit of 20 requests per minute per IP.

Before deploying, add real authentication and a persistent session store. The in-memory session map grows without bound.
