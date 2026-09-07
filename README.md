# CareForMe

## Problem

Small clinics spend hours every week manually following up with patients and managing appointments. CareForMe is an autonomous administrative worker for clinics that handles these workflows in the background.

## Solution

CareForMe monitors, coordinates, executes and follows up on routine administrative workflows using an autonomous agent, automating the routine and escalating the exceptional.

## How the Agent Works

The system uses a genuine agent loop rather than hardcoded if/else automation:
- Event detected
- Observe
- Retrieve context
- Reason
- Select Tool
- Execute Action
- Verify Result
- Update State
- Monitor
- Escalate if necessary

## Architecture

- **Frontend:** Next.js + TypeScript + Tailwind
- **Backend (API Gateway):** FastAPI (Python)
- **Agent:** Strands Agents SDK

## AWS Services

- **Amazon Bedrock:** Foundation model used by the Strands agent.
- **Amazon DynamoDB:** Primary application database.
- **Amazon EventBridge:** Event-driven automation (triggers follow-ups, etc).
- **Amazon S3:** Stores documents and forms.
- **Amazon CloudWatch:** Logging, errors, and monitoring.
- **Amazon Bedrock AgentCore Runtime:** Deploys the Strands agent.

## Strands Agent

The core Operations Agent that determines required actions for administrative events.

## Agent Tools

Patient, appointment, communication, workflow, and clinic tools used by the agent to perform background tasks autonomously.

## Human-in-the-Loop

CareForMe maintains clear boundaries and escalates situations requiring clinical, financial, safety, or staff judgment to human operators.

## Setup

1. Install backend dependencies in the `backend/` folder.
2. Install frontend dependencies in the `frontend/` folder.

## Environment Variables

(Add required environment variables here)

## Running Locally

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Deployment

(Deployment instructions go here)

## Demo

(Link to the demo video or live environment goes here)
