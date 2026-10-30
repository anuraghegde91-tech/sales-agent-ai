# Sales Agent AI

## The problem

Hospital-software sales reps (HIS, LIS, EMR, RIS) walk into meetings with decision-makers who are time-poor and well informed. Preparing properly means digging through news, tender notices, leadership changes and contact details across many tabs, and most reps simply don't have the time. The result is generic pitches that miss the moment.

## What it does

Sales Agent AI gives reps a pre-meeting AI brief, delivered on WhatsApp where they already work. Schedule a meeting and the agent researches the hospital and the contact, then sends a concise brief with live signals, tailored talking points, discovery questions and next steps. Reminders arrive 24 hours and 60 minutes ahead, so the right context shows up at the right moment.

## How it works

Sales Agent AI is a fixed pipeline, not a free-roaming agent. It started as an agent that chose its own tools, but the model's tool-calling failed on the provider's schema, so the steps are now explicit. The result is more predictable, easier to debug and faster.

When a rep saves a meeting, the app researches the hospital and the contact, pulls that hospital's CRM history, and makes one model call that writes the brief, which is then saved. A scheduler refreshes the research about 24 hours before the meeting, sends the brief link on WhatsApp about an hour before, and nudges the rep afterwards to log the outcome.

## Tech stack

- Next.js (App Router) and TypeScript
- Tailwind CSS and Recharts
- Supabase (PostgreSQL, auth, row-level security)
- Groq (Llama 3.3 70B) for brief generation
- Serper for web search intelligence
- Twilio for WhatsApp
- OpenStreetMap Nominatim for location lookup
- Vercel for deployment

## Status

Capstone project. Deployed and tested internally.

## Run it locally

1. Install dependencies: `pnpm install`
2. Copy the environment template and fill in your own values: `cp .env.example .env.local`
3. Run the SQL in `supabase/migrations/` against your Supabase project.
4. Start the dev server: `pnpm dev`
5. Open http://localhost:3000

All variable names are listed in `.env.example`. You will need your own Supabase, Groq, Serper and Twilio accounts.

The reminder scheduler must call `GET /api/reminder` with the header `Authorization: Bearer <CRON_SECRET>`. Requests without a matching header, or any request when `CRON_SECRET` is unset, get a 401.

## What I learned

- Grounding the LLM in scored, pre-structured search results produces far more specific briefs than prompting it alone.
- Meet users where they are: a WhatsApp message gets read, a dashboard often doesn't.
- Time zones deserve a decision on day one: store UTC, convert at the edges.
- Reliable reminders need idempotency flags and generous time windows, not exact timing.
