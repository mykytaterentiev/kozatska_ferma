# Kozatska Ferma: Autonomous Agent Live Demo (FermaAgent)

FermaAgent is a resilient, true multi-agent application built to showcase autonomous customer crisis resolution using the **Google Agent Development Kit (ADK)**. 

This project simulates a premium artisanal food marketplace ("Kozatska Ferma"). It is specifically designed as a live-demo application for academic/technical lectures, demonstrating how a swarm of specialized LLM agents can handle a complex customer support escalation end-to-end without human intervention.

## 🚀 Current Capabilities

*   **Strict Multi-Agent Hierarchy:** Uses Google ADK's `AgentTool` to enforce a strict delegation structure. A Root Coordinator routes tasks to specialized sub-agents.
*   **100% Authentic Dynamic Tracing:** Agent reasoning and tool executions are streamed in real-time. We **do not** use fake fallback pipelines or mock 503s. If an agent fails, the UI shows a genuine system error.
*   **Dual-Authentication Native Support:** Configured to work natively with both standard Google AI Studio (`GOOGLE_API_KEY`) and enterprise Google Cloud Vertex AI (`GOOGLE_CLOUD_PROJECT` + Application Default Credentials).
*   **Decoupled ML Microservice:** Churn prediction is handled by a separate FastAPI service running a scikit-learn Random Forest model, reflecting real-world microservice architectures.
*   **Async-Native Execution:** Fully asynchronous backend using FastAPI's event loop (`async def`), ensuring stable TCP connections and zero threadpool event-loop closures.

## 🧠 The Agent Team (Google ADK)

1.  **`ferma_crisis_coordinator` (The Root):** The brain of the operation. Parses the initial user intent and decides which specialist to call. Synthesizes the final empathetic response to the customer.
2.  **`crm_agent` (Specialist):** Equipped with the `check_crm` tool. Securely fetches customer profiles and active order details from the database.
3.  **`ml_risk_agent` (Specialist):** Equipped with the `predict_churn_risk` tool. Calls the external ML microservice to evaluate the customer's churn probability based on their profile.
4.  **`resolution_agent` (Specialist):** Equipped with the `execute_resolution` tool. Depending on the ML risk score and the severity of the crisis (e.g., spoiled food), executes database refunds and generates promo codes.

## 🔄 Execution Flow

1.  **Trigger:** The user (hardcoded as Ivan Z. `usr_101` with order `#4501`) submits a complaint via the React frontend.
2.  **Orchestration:** The FastAPI backend receives the request and initializes an ADK `Runner` session.
3.  **Delegation (CRM):** The Coordinator delegates to the CRM Agent to verify Order #4501.
4.  **Delegation (ML):** The Coordinator delegates to the ML Agent to calculate churn risk. The ML microservice evaluates the demo scenario to exactly an 88% churn risk.
5.  **Delegation (Resolution):** Recognizing the high churn risk and critical issue (delayed/perishable goods), the Coordinator delegates to the Resolution Agent to issue a 100% refund and a 20% apology promo code.
6.  **Synthesis:** The Coordinator formulates a final, human-friendly response.
7.  **Trace Persistence:** The entire execution trace, including exact tool latencies, is saved to Supabase (`agent_traces` table).
8.  **Render:** The React frontend (polling or receiving the response) renders the live trace logs in the dark-mode Admin Trace Panel and the chat response in the light-mode B2C Chat View.

## 🛠️ Project Structure

*   `/backend/app/agent/`: Core Google ADK agent definitions and asynchronous runner logic.
*   `/backend/app/api/`: FastAPI route handlers (`/api/chat`, `/api/traces`).
*   `/backend/app/tools/`: ADK Tool definitions wrapping external APIs and DB calls.
*   `/backend/app/ml/`: Standalone Random Forest churn prediction microservice (runs on port 8001).
*   `/frontend/`: Vite + React + Tailwind frontend with dedicated B2C and Admin UI views.
*   `/backend/scripts/`: Database seeding and ML training scripts.

## 🔑 Setup & Configuration

**1. Database (Supabase):**
Ensure your Supabase project is active and seeded using `poetry run python scripts/seed_demo.py`.

**2. Authentication (Choose One in `backend/.env`):**
*   *For Vertex AI (Recommended for Enterprise/GCP):*
    ```env
    GOOGLE_CLOUD_PROJECT=your-gcp-project-id
    GOOGLE_CLOUD_LOCATION=us-central1
    # Run: gcloud auth application-default login
    ```
*   *For AI Studio (Standard API Key):*
    ```env
    GOOGLE_API_KEY=AIzaSy... # Must be a valid AI Studio key
    ```

**3. Running the Stack:**
You need three terminal tabs:
*   **Terminal 1 (ML Microservice):** `cd backend && poetry run uvicorn app.ml.main:app --port 8001`
*   **Terminal 2 (FastAPI Backend):** `cd backend && poetry run uvicorn app.main:app --port 8000 --reload`
*   **Terminal 3 (React Frontend):** `cd frontend && npm run dev`

---
*Built for the Kozatska Ferma 2026 Live Demo.*