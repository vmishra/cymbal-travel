<div align="center">

# ✈️ Cymbal Travels

### Plan an entire trip just by talking — then handle everything after you book.

A voice-first, agentic travel concierge: speak your trip, watch a multi-city
itinerary build itself live, edit it by voice, and get end-to-end post-sale
support mid-journey. Built on the Google Cloud agentic stack.

<br/>

`Voice` · `Agentic orchestration` · `Google Maps` · `Grounded in Search & Weather` · `₹ pricing`

<br/>

**Two acts:** 🗺️ Pre-sale planning  ·  🎧 Post-sale "Cymbal Care" support
&nbsp;•&nbsp; **Two ways to run:** scripted demo (no credentials) or live voice

</div>

---

## What it is

**Cymbal Travels** is a demo of what travel booking looks like when it's a
*conversation* instead of forty browser tabs. A traveller describes their trip
out loud; a team of specialist agents plans flights, hotels, activities and
events in parallel; and a day-by-day itinerary materialises on a real map —
grounded in Google Maps, Search and weather data, never guessed.

After the trip is booked, the same assistant becomes a **customer-support agent**:
it pulls up the traveller mid-journey, understands a change request ("we'd like an
extra day in Tokyo — move our flight"), and completes it end-to-end — reschedule,
extend the hotel, keep seats and meal preferences, and take payment on the
authorized card.

> Brand-neutral by design (**"Cymbal Travels"** is fictional), prices in ₹, trips
> originate in India. Everything plugs into real inventory APIs by swapping the
> mock services behind clean tool calls.

---

## Highlights

| | |
|---|---|
| 🎙️ **Voice-first** | Plan and edit a whole trip hands-free with Gemini Live (native audio). Natural multilingual concierge — chic Hinglish by default, switches languages on request. |
| 🧠 **Visible agentic orchestration** | Watch specialist agents (Flights · Hotels · Itinerary · Events) run in parallel, with live "grounded with Maps / Search / Weather" signals. |
| 🗺️ **Real, grounded map** | A real Google Map geocodes any city, draws the route, and focuses a place when you tap its card — with live transit hops and traffic. |
| 🖼️ **Generated imagery** | Place and hotel cards use images generated on demand (Nano Banana), cached locally. |
| 🎧 **End-to-end post-sale** | A dedicated **Cymbal Care** support screen: locate the customer, itemise every change and its cost, and charge the card on file — no hand-off. |
| 🧩 **Robust by construction** | Any city, any route, odd trip lengths — tolerant parsing and informative tool responses keep it from ever breaking on stage. |

---

## Demo in 60 seconds

**Act 1 — Pre-sale.** *"Plan a 7-night family trip to Japan from Bangalore,
around ₹2 lakh per person, three or four cities, leisurely — I want Mount Fuji,
the bullet train and a seasonal festival."* → agents fan out → a grounded,
under-budget itinerary appears → *"Make the Tokyo hotel premium"* / *"Add a tea
ceremony in Kyoto"* edit it live.

**Act 2 — Post-sale (Cymbal Care).** Switch to **Post-sale**. The customer is
mid-trip (Day 3, Tokyo). *"We'd love an extra day — can you move our onward
flight?"* → the agent finds the next-day flight, keeps seats/meals, extends the
hotel, summarises the fare difference, and charges the authorized card —
confirmed end-to-end.

📖 A full presenter script for both acts (plus the architecture walkthrough) is in
**[`DEMO_GUIDE.md`](./DEMO_GUIDE.md)**.

---

## Architecture

An agentic stack on Google Cloud. The app ships with a clean reference-architecture
view inside the UI (**Architecture** tab); in short:

```
Experience        Gemini Live (native audio) · web & mobile · multilingual
      │
Agent runtime     Vertex AI Agent Engine (ADK) — Flights · Hotels · Itinerary ·
      │           Events · Payments specialist agents (A2A)
      │
Models — Gemini   reasoning · speech · imagery (Nano Banana)
      │
Grounding & tools Google Maps grounding · Grounding with Google Search ·
      │           weather · function-calling over tools
      │
Memory & context  agent memory · long context — remembers the traveller
      │
Data              managed inventory, vectors & analytics
      │
Trust & platform  serverless scale · safety · IAM · tracing & audit
```

**How it runs today.** A FastAPI backend exposes the agent + tool layer over a
WebSocket. Tool calls run against an authoritative in-memory trip session and
stream typed UI events to a React client, which animates each change. The exact
same tool pipeline is driven by either a **live voice** session or a **scripted
simulation**, so the demo is identical with or without a microphone.

---

## Tech stack

**Backend** — Python 3.13 · FastAPI · Gemini Live on Vertex AI · Pydantic domain model · pytest
**Frontend** — React + TypeScript · Vite · Tailwind CSS · Google Maps JS · Vitest · Playwright

---

## Quick start

**Prerequisites:** Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 20+ / npm.
A Gemini API key is only needed for *live voice* — the full scripted demo runs
with **no credentials**.

```bash
# 1. configure env (both files are gitignored — never commit real keys)
cp .env.example .env                      # add GOOGLE_API_KEY for live voice
cp frontend/.env.example frontend/.env    # optional: VITE_GOOGLE_MAPS_API_KEY for the live map

# 2. run backend (FastAPI :8470) + frontend (Vite)
./start.sh
# open the Vite URL that prints

# 3. stop
./stop.sh
```

### Run modes (header toggle)

- **Sim** — the scripted happy path. Press **Start**; everything runs on a timed
  script (no mic, no keys). Rock-solid for stage. Append `?fast=1` to the URL to
  run it instantly.
- **Voice** — a real Gemini Live session. Needs `GOOGLE_API_KEY`. Press **Start**,
  grant the mic, and speak. A text box is available as a fallback.

---

## Testing

```bash
cd backend  && .venv/bin/python -m pytest     # backend unit/integration (58)
cd frontend && npx vitest run                 # reducer / component units (30)
cd frontend && npx playwright test            # browser e2e (pre-sale + post-sale)
```

---

## Project structure

```
backend/        FastAPI app: agent tools, mock services, voice proxy, sim pipeline
  app/
    tools.py          voice-callable tools → (result, ui_events)
    mock_services.py  deterministic, brand-neutral flights/hotels/activities/events
    voice.py          Gemini Live WebSocket proxy
    sim.py            credential-free scripted scenarios
  tests/
frontend/       React + Vite client
  src/
    components/       Assistant · Itinerary · Map · PostSale (Cymbal Care) · Architecture
    state/            typed UI-event reducer
    voice/            Gemini Live hook + PCM audio
  e2e/            Playwright specs
DEMO_GUIDE.md   presenter script for both acts + the architecture walkthrough
```

---

## What's real vs. mocked

| Real | Mocked for the demo |
|---|---|
| The voice conversation (Gemini Live) | Flight / hotel / activity / event **inventory** (tiered options) |
| The Google Map (tiles, geocoding, routing) | Weather values & currency rates (realistic) |
| The generated card imagery | Payment / booking (no real charge; references are generated) |
| The agent orchestration & tool pipeline | |

Swap the mock services for your own inventory APIs and the behaviour is real.

---

## Disclaimer

A demonstration project. **"Cymbal Travels" is a fictional, brand-neutral name**;
any resemblance to real companies, prices or inventory is incidental. Not an
official Google product. Set your own API keys locally — never commit them.
