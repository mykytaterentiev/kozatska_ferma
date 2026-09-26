# Kozatska Ferma: Autonomous Agent Live Demo (FermaAgent)

FermaAgent is a highly resilient, true multi-agent application built to showcase autonomous AI capabilities using the **Google Agent Development Kit (ADK)** and **Gemini 3.1 Flash-Lite**.

This project simulates a premium artisanal food marketplace ("Kozatska Ferma"). It is specifically designed as a live-demo application for academic and technical lectures, demonstrating two advanced AI paradigms:
1. **B2C Support:** A swarm of specialized agents handling a complex customer crisis end-to-end without human intervention.
2. **A2A Commerce:** Two independent LLMs (a Consumer Agent and a B2B Storefront Agent) autonomously negotiating price, checking inventory, and dispatching logistics in real-time.

## 🚀 Key Features

*   **Real-Time A2A Negotiation:** Watch two AI agents autonomously haggle over price and inventory constraints. The backend streams the LLM inference back to the frontend in true real-time using an NDJSON (Newline Delimited JSON) Server-Sent Events stream.
*   **Cinematic Map Storytelling:** The A2A dashboard features a reactive React-Leaflet map that fetches actual street geometries via the public **OSRM API**. As the agents negotiate, the camera flies to the coordinates, draws dashed logistical projections, and dispatches a vehicle upon deal confirmation.
*   **Strict Multi-Agent Hierarchy:** Uses Google ADK's `AgentTool` to enforce a strict delegation structure. A Root Coordinator routes tasks to specialized sub-agents (CRM, ML Risk, Resolution).
*   **Decoupled ML Microservice:** Churn prediction is handled by a separate FastAPI service running a scikit-learn Random Forest model, reflecting real-world microservice architectures.
*   **Authentic Dynamic Tracing:** Agent reasoning, tool latency, and SQL executions are streamed and persisted directly to a Supabase database. We do not use mock pipelines. 

## 🧠 The Agent Swarm

### Crisis Support (B2C)
1.  **`ferma_crisis_coordinator`:** The brain of the operation. Parses the initial user intent and coordinates the specialists.
2.  **`crm_agent`:** Fetches customer profiles and active order details from Supabase.
3.  **`ml_risk_agent`:** Calls the external ML microservice to evaluate the customer's churn probability.
4.  **`resolution_agent`:** Executes database refunds and generates promo codes if churn risk is critical.

### Autonomous Commerce (A2A)
1.  **`consumer_agent`:** Acts on behalf of the buyer. Given strict budget and coordinate constraints, it attempts to secure the best deal.
2.  **`storefront_agent`:** The B2B seller. Equipped with tools to `check_inventory`, verify `check_loyalty_tier` for discounts, and `dispatch_delivery` to finalize the sale.

## 🛠️ Project Structure

*   `/backend/app/agent/`: Core Google ADK agent definitions, runners, and the A2A NDJSON streaming engine.
*   `/backend/app/api/`: FastAPI route handlers (`/api/chat`, `/api/traces`, `/api/a2a/simulate`).
*   `/backend/app/tools/`: Python functions that the LLMs invoke to interact with Supabase and ML models.
*   `/backend/app/ml/`: Standalone Random Forest churn prediction microservice.
*   `/frontend/`: Vite + React + Tailwind frontend featuring the B2C storefront, Admin Trace Panel, and A2A cinematic map.
*   `/backend/scripts/`: Database seeding and ML training scripts.

## 🔑 Local Setup

**1. Database (Supabase):**
Ensure your Supabase project is active and run the seed script to populate the demo inventory and users:
```bash
cd backend
poetry install
poetry run python scripts/seed_demo.py
```

**2. Environment Variables:**
Create a `.env` in the `backend/` directory:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
GOOGLE_API_KEY=your-ai-studio-key
GEMINI_MODEL=gemini-3.1-flash-lite
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

## ☁️ Production Deployment

The architecture is heavily decoupled and optimized for modern serverless and PaaS platforms. 

### Deploying Backend to Railway
Railway natively supports Python Poetry projects out of the box via the included `Procfile`.
1. Connect your GitHub repository in Railway.
2. In the project settings, set the **Root Directory** to `/backend`.
3. Add your environment variables (Supabase and Google keys).
4. Generate a public domain under Networking (e.g., `ferma-backend.up.railway.app`).

### Deploying Frontend to Vercel
The frontend includes a `vercel.json` file designed to seamlessly proxy `/api` calls directly to your backend, preventing CORS issues.
1. Edit `frontend/vercel.json` and replace `<YOUR_RAILWAY_URL>` with your actual Railway domain.
2. Connect your GitHub repository in Vercel.
3. Set the **Root Directory** to `frontend`.
4. Vercel will auto-detect Vite and deploy instantly.

---
*Built for the Kozatska Ferma Live Demo.*