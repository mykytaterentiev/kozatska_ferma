# Kozatska Ferma: Autonomous Agent Live Demo (FermaAgent)

FermaAgent is a highly resilient, true multi-agent application built to showcase autonomous AI capabilities using the **Google Agent Development Kit (ADK)** and the **Gemini API**.

This project simulates a premium artisanal food marketplace ("Kozatska Ferma"). It is specifically designed as a live-demo application for academic and technical lectures, demonstrating advanced AI paradigms through three main interfaces:
1. **B2C Support:** A swarm of specialized agents handling a complex customer crisis end-to-end without human intervention. Features a dynamic persona switcher to test different ML risk thresholds (Ivan, Olena, Taras).
2. **A2A Commerce:** Two independent LLMs (a Consumer Agent and a B2B Storefront Agent) autonomously negotiating price, checking inventory, and dispatching logistics in real-time.
3. **Internal Marketing Copilot:** An English-first internal agent designed to help the Ferma team craft campaigns using a dedicated text stream.

## Core Architecture & Tech Stack

*   **Frontend:** React 18, Vite, Tailwind CSS, TypeScript.
*   **Backend:** FastAPI, Python 3.11+, Google Agent Development Kit (ADK).
*   **Database:** Supabase (PostgreSQL) with strict Row Level Security (RLS).
*   **ML Microservice:** Scikit-Learn (Random Forest) running on a separate FastAPI instance.

## Technical Implementation Details & Constraints

This project was built adhering to strict architectural constraints to ensure a flawless, hallucination-free live demo experience.

### 1. Memory Management & Context Injection
*   **No Database Bloat:** Conversational memory is preserved across multi-turn API requests utilizing a globally instantiated `InMemorySessionService`. We do not store raw LLM conversational arrays in the database.
*   **Context Safety:** The current `user_id` and the current date (e.g., Year 2026) are dynamically injected into the Agent's system prompt to prevent temporal or persona hallucinations.
*   **Hard Reset:** Demo reset logic (`/api/reset`) explicitly flushes the `InMemorySessionService` and wipes the Supabase trace tables to prevent LLM context bleed between demo runs.

### 2. Multi-Agent Hierarchy (ADK)
*   **Strict Delegation:** Uses Google ADK's `AgentTool`, `LoopAgent`, and `SequentialAgent` to enforce a rigid delegation structure. A Root Coordinator routes tasks to specialized sub-agents.
*   **Resolution Strategy:** The `resolution_agent` strictly follows programmatic tiers:
    *   **Critical Risk (>0.70):** Full refund + 20% discount (`FERMA-RECOVER-20`).
    *   **VIP (LTV > $20k):** Full refund + 30% discount (`FERMA-VIP-30`).
    *   **Normal (<0.40):** No refund, escalate to human, 5% apology discount (`FERMA-CARE-5`).
*   **Marketing Co-Pilot:** Operates entirely in English, acting as an internal staff assistant.

### 3. Traceability & Database Security
*   **Unified DB Traces:** Database traces are unified via SQL `UPDATE` operations, appending new conversational steps and tool executions to the most recent user trace document.
*   **Agent Flow Segmentation:** The `agent_traces` table uses an `agent_flow` column (TEXT) to segment B2C, A2A, and Marketing runs. JSONB extraction (`trace_log->>user_id`) is used for querying.
*   **Strict RLS:** All Supabase tables (`users`, `orders`, `agent_traces`) have `ENABLE ROW LEVEL SECURITY` strictly enforced. 

### 4. UI/UX: The "Labor Illusion" & Styling
*   **Labor Illusion UX:** We do not hide background agent work. The backend executes an NDJSON (Newline Delimited JSON) stream that traps `function_call` events, streaming tool executions to dynamically replace the standard "typing..." indicator in the UI.
*   **Anti-Flicker Streaming:** To prevent "double-bubble" artifacts, the user input state is cleared synchronously *before* awaiting the stream reader, and empty agent messages are suppressed until text generation actually begins.
*   **Strict Tailwind Tokens:** The UI utilizes high-accessibility contrast tokens (`bg-brand-roasted`, `text-brand-kraft`). Hardcoded hex colors were eradicated to fix global background shifting anomalies, utilizing transparent wrappers to inherit a unified global SVG noise texture overlay (`#F3F0EB` equivalent).
*   **Flexbox Constraints:** Fixed UI headers and footers utilize `flex-shrink-0 relative` to prevent CSS flexbox clipping and horizontal overflow in chat containers.

## Local Setup

**1. Database (Supabase):**
Ensure your Supabase project is active, apply the schema (`backend/schema.sql`), and run the seed script:
```bash
cd backend
poetry install
poetry run python scripts/seed_demo.py
```

**2. Environment Variables:**
Create a `.env` in the `backend/` directory:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
GOOGLE_API_KEY=your-google-ai-key
GEMINI_MODEL=gemini-2.5-flash
```

**3. Running the Stack:**
```bash
# Terminal 1: ML Microservice
cd backend && poetry run uvicorn app.ml.main:app --port 8001

# Terminal 2: FastAPI Backend
cd backend && poetry run uvicorn app.main:app --port 8000 --reload

# Terminal 3: React Frontend
cd frontend && npm run dev
```

## Production Deployment

### Backend (Railway)
1. Set **Root Directory** to `/backend`.
2. Add environment variables.
3. Railway natively supports Poetry via the included `Procfile`.

### Frontend (Vercel)
1. Set **Root Directory** to `frontend`.
2. Edit `frontend/vercel.json` and replace the `<YOUR_RAILWAY_URL>` proxy destination with your live backend domain.
3. Deploy via Vite preset.

---
*Built for the Kozatska Ferma Live Demo.*