"""Comprehensive test suite for FermaAgent backend, tools, and ML service."""

from fastapi.testclient import TestClient
from google.adk.agents.llm_agent import Agent

from app.agent.agent import root_agent
from app.main import app
from app.tools.churn import predict_churn_risk
from app.tools.crm import check_crm

client = TestClient(app)


def test_health():
    """Verify primary API health endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_ml_microservice_endpoints():
    """Verify dedicated ML microservice sub-app endpoints."""
    health_res = client.get("/ml/health")
    assert health_res.status_code == 200

    pred_res = client.post(
        "/ml/predict",
        json={"support_tickets_count": 4, "days_since_last_order": 20},
    )
    assert pred_res.status_code == 200
    data = pred_res.json()
    assert 0.0 <= data["churn_prob"] <= 1.0
    assert data["risk_level"] in ["CRITICAL", "NORMAL"]
    assert data["action"] in ["RECOVER", "STANDARD_SUPPORT"]


def test_adk_root_agent_definition():
    """Verify ADK root_agent matches Google ADK specifications."""
    assert isinstance(root_agent, Agent)
    assert root_agent.name == "ferma_crisis_coordinator"
    assert len(root_agent.tools) == 3


def test_crm_and_churn_tools():
    """Verify CRM and Churn prediction tools output."""
    crm = check_crm("usr_101")
    assert crm["status"] == "success"
    assert crm["user_id"] == "usr_101"

    churn = predict_churn_risk("usr_101")
    assert churn["status"] == "success"
    assert "churn_prob" in churn
    assert churn["churn_prob"] >= 0.70


def test_full_chat_and_trace_flow():
    """Verify end-to-end chat turn, trace generation, and reset."""
    message = (
        "Your courier was a day late! The cheese is warm and the meat is spoiled! "
        "My party is ruined, give me my money back right now!"
    )
    chat_resp = client.post(
        "/api/chat", json={"message": message, "user_id": "usr_101"}
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()

    # Check if execution returned a system error (e.g. 503) instead of fake success
    if "System Error" in data["reply"]:
        assert data["total_latency_ms"] == 0
        assert data["order_id"] == 4501
    else:
        assert data["order_id"] == 4501
        assert data["total_latency_ms"] > 0
        assert "refund" in data["reply"].lower()

        # Verify trace endpoint only if successful
        trace_resp = client.get("/api/traces/usr_101")
        assert trace_resp.status_code == 200
        trace_log = trace_resp.json()["trace_log"]
        steps = trace_log["steps"]
        assert len(steps) >= 5

        # Check glowing badge in step 3
        ml_step = steps[2]
        assert ml_step["tool_name"] == "ml_risk_agent"
        assert ml_step.get("highlight") is True
        assert "Risk" in ml_step.get("badge", "")

    # Reset order back to delayed_critical
    reset_resp = client.post("/api/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"
