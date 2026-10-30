# Cymbal Travels — Voice-First Agentic Travel Planner

A voice-controlled travel planner + post-sale support demo showcasing Gemini 3.8
Live and a visible agentic-orchestration story. Brand-neutral ("Cymbal Travels"),
Google-colors-light, flights/hotels mocked. Real voice; everything else mocked.

See `DEMO_GUIDE.md` for the presenter script (pre-sale, post-sale and the
architecture walkthrough).

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

Two modes via the header toggle:
- **Sim** — the scripted happy path. Press **Start**; everything runs on a timed
  script (no mic, no API key). Rock-solid for stage. Use `/` normally; append
  `?fast=1` to run it instantly (used by e2e).
- **Voice** — the real **Gemini 3.8 Live** session. Needs `GOOGLE_API_KEY` in
  `.env`. Press **Start**, grant mic, then speak. A text box appears as a fallback
  if the mic misbehaves — type the same requests.

**The story (what to say in Voice mode):**
1. *"Plan a seven-night, eight-day family trip to Japan from Bangalore, for me and
   my eight-year-old son. Budget around two lakh per person. Cover three or four
   cities, keep it leisurely — I want to see Mount Fuji, ride the bullet train, and
   catch a popular seasonal event."* → watch the **Under the hood** panel fan out
   (Flights / Hotels / Itinerary / Events) with Maps · Search · WeatherNext
   grounding, then the itinerary + map materialize under budget.
2. *"Swap the Tokyo hotel for something more premium."* → the hotel card flips.
3. *"Add a dinner at a local ramen place on day two."* / *"Add a tea ceremony in
   Kyoto."* → cards animate in.
4. Toggle **Post-sale** → *"My Tokyo flight is delayed — find me alternatives."* →
   disruption banner + rebooking options. *"Rebook me on the next good option."* →
   itinerary heals, confirmation card.

**If anything wobbles live:** flip to **Sim** and press Start — same visuals, zero
dependencies.

**Optional:** set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env` for a live Google
map; otherwise a stylized route map is shown.

## Verification
- Backend: `cd backend && .venv/bin/python -m pytest` (31 tests)
- Frontend units: `cd frontend && npx vitest run` (19 tests)
- Browser e2e: `cd frontend && npx playwright test` (full happy path in Chromium)
