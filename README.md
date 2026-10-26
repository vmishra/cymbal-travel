# Cymbal Travels — Voice-First Agentic Travel Planner

A voice-controlled travel planner + post-sale support demo showcasing Gemini 3.8
Live and a visible agentic-orchestration story. Brand-neutral ("Cymbal Travels"),
Google-colors-light, flights/hotels mocked. Real voice; everything else mocked.

See `docs/design/` for the design and `docs/design/` for the
implementation plan.

## Prerequisites
- Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 20+ / npm.
- A Gemini API key (for real voice). Without one, the app still runs the full
  scripted happy path in **sim mode** (no credentials needed).

## Setup
```bash
cp .env.example .env            # add GOOGLE_API_KEY for real voice
cp frontend/.env.example frontend/.env   # optional: VITE_GOOGLE_MAPS_API_KEY
```

## Run
```bash
./start.sh        # backend on :8470, frontend (Vite) dev server
# then open the Vite URL
./stop.sh         # stop both
```

## Test
```bash
cd backend && .venv/bin/python -m pytest        # backend unit/integration
cd frontend && npm run test                     # vitest (reducer, audio)
cd frontend && npm run e2e                       # Playwright (sim-driven)
```

## Demo-day runbook
Filled in at Task 16 (the exact utterances and the Sim/Voice toggle).
