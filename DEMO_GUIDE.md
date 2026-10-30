# Cymbal Travels — Demo Guide

A presenter's script for the "Think Travel" demo. Audience: travel / airline /
hospitality executives — CMOs, country heads, product leaders. The story has two
acts (**Pre-sale planning** and **Post-sale support / "Cymbal Care"**) plus an
**Architecture** walkthrough.

> **One-line pitch:** *"A traveller plans an entire multi-city trip just by
> talking — and after they've booked, the same agent handles changes end-to-end.
> All of it grounded in Google Maps, Search and Weather, and built on Google
> Cloud's agentic stack."*

---

## 0. Before you walk on stage

**Launch:** the app serves on `http://localhost:8470`.

```bash
cd backend && PORT=8470 .venv/bin/python -m app.main   # serves API + built UI
```
If you changed the frontend, rebuild first: `cd frontend && npm run build`.

**The toggles (top bar), left to right:**

| Control | Options | What it does |
|---|---|---|
| **Planner / Architecture** (top centre) | — | The demo app vs. the reference-architecture page |
| **Plan / Post-sale** (top right) | — | Act 1 (planning) vs. Act 2 (Cymbal Care support) |
| **Sim / Voice** | — | Scripted walkthrough vs. live microphone (Gemini Live) |
| **Start / Stop** | — | Begins the selected scenario |

**Two ways to run each act:**
- **Sim** — a scripted, deterministic walkthrough. *Use this on stage.* It never
  fails, needs no mic, and hits every beat on a timeline. Add `?fast=1` to the URL
  to make it instant (good for rehearsal; leave it off for the live pace).
- **Voice** — a real microphone conversation with **Isha** (Gemini Live). Use this
  for the "wow" moment or Q&A. It's live, so expect natural variation.

**The persona — Isha:** a poised, warm, professional Indian travel agent (~30).
Speaks chic **Hinglish** in an Indian accent, female voice, switches to any Indian
language on request. Calm and composed — not a bubbly chatbot. Prices in **₹**,
origins in India.

**Golden rule for stage:** drive with **Sim**. Offer **Voice** as the encore.

---

## 1. Framing (say this first — ~30 seconds)

> "Booking a family holiday today means forty browser tabs. Watch what it looks
> like when it's a conversation instead. I'll plan a 7-night Japan trip for a
> family of three, from Bangalore, just by talking — and then I'll switch to
> *after* they've booked, when something needs to change mid-trip."

Then: **Planner** view, **Plan** mode, **Sim**, press **Start**.

---

## 2. Act 1 — Pre-sale planning

### 2a. Running it in Sim (recommended on stage)

Press **Start**. The scripted conversation plays out. You narrate over it. The
beats and **what to point at**:

| Beat (Isha / traveller) | Point at |
|---|---|
| Traveller asks for a 7N Japan family trip, ~₹2L pp, 3–4 cities, Mount Fuji, bullet train, a seasonal event | The **requirements** being extracted into the trip brief (nights, budget, best time, weather) |
| Isha fires the orchestration | The **"DeepDive thinking"** steps + the **Flights / Hotels / Itinerary / Events** agents running in parallel, and **Grounded with Maps · Search · WeatherNext** |
| Itinerary appears | The **day-by-day plan** (Overview + Day tabs, Morning/Afternoon/Evening), real **place photos**, the **real Google Map** with the route, **transit hops** ("🚕 12 min · moderate traffic"), and the **live Weather + FX** widgets |
| "What's the total cost?" | The **cost breakdown** + budget bar — "comfortably under ₹2L per person" |
| "Make the Tokyo hotel more premium" | The hotel card **swaps live** and the cost updates |
| "Add a tea ceremony in Kyoto" | A new activity card **appears on the right day**; click any place → it **opens on the map** |

**What to emphasise:**
- *"Nothing was typed."* The whole trip came from one spoken paragraph.
- *"It's grounded, not guessed"* — real Maps, real route, real weather window.
- *"It's editable by voice"* — swap a hotel, add a dinner, add an activity, and
  the plan + the map + the price all move together.

### 2b. Running it in Voice (the encore)

Switch **Sim → Voice**, press **Start**. Isha greets:
*"Namaste, main Isha — aapki Cymbal Travels agent. Tell me, where would you like
to travel?"*

**Say these, one at a time** (let her ask follow-ups between):

1. *"We want to go to Japan in December — me, my wife and our eight-year-old son."*
2. *"About seven nights, three or four cities, nothing too rushed."*
3. *"Budget's around two lakh per person. We'd love Mount Fuji and the bullet train."*
4. *"What's the total cost?"*
5. *"Can you make the Tokyo hotel a bit more premium?"*
6. *"Add a tea ceremony in Kyoto."*

**Freestyle prompts that also work** (shows robustness — it's not on rails):
- *"Change the trip to Bangalore to Tokyo only."*  / *"Plan me a weekend in Jaipur."*
- *"What's the weather like there in December?"*  / *"What should we pack?"*
- *"Add a dinner on our second night."* / *"How do we get from Tokyo to Kyoto?"*
- *"Speak to me in Hindi."* (she switches, stays female + Indian accent)

> **Tip:** keep requests short and pause. Isha speaks in brief turns on purpose.

---

## 3. Act 2 — Post-sale: "Cymbal Care"

Switch **Plan → Post-sale**. This is a **deliberately different, cleaner screen** —
a support desk, not the planner. Framing:

> "Fast-forward. The family booked, they're mid-trip — Day 3, in Tokyo — and they
> call support. This is where most travel brands fall back to a call centre. Watch
> the same agent handle it."

### 3a. Running it in Sim (recommended on stage)

Make sure **Post-sale** + **Sim** are selected, press **Start**. Beats and
**what to point at**:

| Beat | Point at |
|---|---|
| "Opening your case…" | The **fetch sequence** (customer details → booking & itinerary → current leg) — "it's pulling up a live account, not starting cold" |
| Case loads | The **customer card** (Vikas Mishra, party of 3, Cymbal Gold, booking ref, seats, meal) and **"Where they are now"** — Day 3 of the trip, current hotel "here now", the flight, the train leg |
| "We'd like an extra day — move our onward flight" | Isha asks the **reason** (patient, human) |
| Isha finds the next-day flight | A **pending change** appears: *Move flight · +₹10,000 · proposed* |
| "Keep the same seats and meals" | A **confirmed** detail line: seats + party + vegetarian meals |
| "Extend our current hotel" | A **confirmed** hotel line: *extra night · +₹7,400*; the **day rail grows** to 8 days |
| Isha summarises + asks about payment | The **Payment** block: authorized Visa •••• 4242, **amount due ₹17,400** |
| "Use the same card" | Payment flips to **Paid ✓** with a confirmation reference (read back one digit at a time) |

**What to emphasise:**
- *"It knew who was calling and exactly where they were in their trip."*
- *"Every change is itemised and priced in real time — flight, hotel, preferences."*
- *"It closed the loop: it took payment on the authorized card and confirmed
  end-to-end. No transfer, no hold music."*

### 3b. Running it in Voice (the encore)

Switch **Sim → Voice**, press **Start** (in Post-sale mode). Isha opens the case
and greets the customer by name. **Say, one at a time:**

1. *"We're loving Tokyo — can we stay one more day? Can you move our onward flight?"*
2. (she asks the reason) *"We just want an extra day to explore."*
3. (she quotes the fare difference) *"Yes, keep the same seats and meals."*
4. (she offers hotel options) *"Just extend our current hotel."*
5. (she summarises + asks about payment) *"Use the same card."*

**Other post-sale capabilities to show off** (all supported):
- *"Actually, find us a hotel near the airport instead."* (books a fresh one)
- *"Add something to do on the extra day."* (adds an alternate activity)
- *"Can I get a refund for the tea ceremony?"* (starts a refund)
- *"My flight got delayed."* (pulls alternatives)

---

## 4. Architecture walkthrough

Switch to the **Architecture** view (top centre). This is for the "how is it
built / can *we* build this" conversation. Walk top to bottom.

**Hero — "The agentic travel stack."**
> "Everything you just saw, end-to-end on Google Cloud — the same foundations any
> travel, airline or hospitality brand can use."

**Three pillars / four value cards** — the business message:
Plan by voice · Grounded, never guessed · Remembers every traveller →
**Voice-first · Trustworthy · Personal · Enterprise-ready.**

**The flow strip:** Traveller speaks → Agent plans → Tools run in parallel →
Specialists compose → Gemini synthesises → Booked & remembered.

**The seven layers** (one talking point each; the glowing dots = *live in this demo*):

| # | Layer | One-liner |
|---|---|---|
| 01 | **Experience** | Hands-free voice is the hero — Gemini Live native audio, on web & mobile, multilingual |
| 02 | **Agent runtime** | Vertex AI Agent Engine (ADK) orchestrates a *team* of specialist agents — Flights, Hotels, Itinerary, Events, Payments; A2A between them |
| 03 | **Models — Gemini** | The right model for each job: Gemini 3 Pro to reason, Gemini 3.8 Live for speech, Nano Banana Pro for imagery |
| 04 | **Grounding & tools** | The antidote to hallucination — Maps Grounding, Grounding with Google Search, WeatherNext, function calling over MCP |
| 05 | **Memory & context** | Agent Memory Bank + long context — it remembers the traveller trip to trip |
| 06 | **Data** | Managed inventory, vectors & analytics — Spanner, AlloyDB, BigQuery, Firestore |
| 07 | **Trust & platform** | Serverless scale with Model Armor, IAM/OAuth, Cloud Trace & audit built in |

### Important honesty note (so you're never caught out)
- **The live demo runs on Gemini 2.5 native audio (Vertex AI), voice "Kore".**
  That's today's production-grade voice model. The header badge shows the model.
- **The architecture page shows Gemini 3.8 Live** as the forward path — it's the
  blueprint, not necessarily what's wired into this build. If asked:
  > "The demo you saw runs on Gemini 2.5 native audio today; the reference
  > architecture shows the roadmap to 3.8 Live — same pattern, drop-in upgrade."

---

## 5. What's real vs. mocked (answer honestly if asked)

| Real | Mocked for the demo |
|---|---|
| The **voice** conversation (Gemini Live on Vertex) | Flight / hotel / activity / event **inventory** (tiered mock options) |
| The **Google Map** (real tiles, geocoding, routing) | Weather values & currency rates (realistic, "live"-styled) |
| The **place images** (generated with Nano Banana) | Payment / booking (no real charge; confirmation refs are generated) |
| The **agent orchestration + tool-calling** pipeline | — |

> "Everything that would plug into your GDS, PSS, or property-management system is
> mocked behind clean tool calls — swap the mocks for your inventory APIs and it's
> real."

---

## 6. Anticipated questions

- **"Is this on rails?"** — No. Sim is the scripted stage version for reliability;
  Voice is live and open-ended. Offer to take a request from the audience.
- **"What languages?"** — Hinglish by default; any major Indian language on
  request; the architecture supports live translation across ~97 languages.
- **"How does it avoid making things up?"** — Grounding. Places, routes and
  weather come from Google Maps / Search / WeatherNext, with citations.
- **"Can it remember repeat customers?"** — Yes — Agent Memory Bank (layer 05).
  Post-sale already loads a known customer's profile and current trip.
- **"How hard to adapt to our brand?"** — Brand-neutral by design. Swap the
  inventory tool implementations, theme, and persona; the agent stack is unchanged.
- **"Does it actually take payment?"** — The flow is end-to-end (authorize →
  charge → confirm); in the demo the payment step is mocked. A Payments agent slot
  exists in the runtime for a real PSP.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Screen stuck on the opening screen | Press **Start**; check the backend is running on **8470** |
| Voice won't connect | Check mic permissions; confirm `.env` has the Vertex settings; fall back to **Sim** |
| Map looks like a stylised fallback | Google Maps key missing/blocked — still fully functional, just not live tiles |
| Images slow to appear | Nano Banana generates on first request, then caches — they fade in |
| Want it instant for rehearsal | Add `?fast=1` to the URL (skips the on-stage pacing) |

---

## 8. 90-second "tight" run (if you're short on time)

1. **Plan · Sim · Start.** Narrate the parallel agents + grounded itinerary. (30s)
2. *"Make the Tokyo hotel premium / add a tea ceremony"* already in the script —
   call out the live edit + map focus. (15s)
3. **Post-sale · Sim · Start.** "Same family, mid-trip, Day 3." Extend a day →
   flight + hotel + **Paid ✓**. (30s)
4. **Architecture** — hero + "grounded, never guessed" + "runs on Vertex AI Agent
   Engine." (15s)
