# Prime Talk

Prime Talk is a React + Supabase tutoring platform for instant and scheduled English lessons with Daily.co video rooms.

## Stack

- React 19 + Vite
- Supabase (Auth, Postgres, Realtime, Edge Functions)
- Daily.co (video rooms)
- Tailwind CSS
- Node-style API routes (`/api/*`)

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (or local Supabase via CLI)
- Daily.co API key

## Environment Variables

Create a local `.env` from `.env.example` and fill values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (client + API routes) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key for frontend auth/data |
| `VITE_DAILY_API_KEY` | Optional | Client-side Daily room helper (legacy/optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (API routes) | Server-side Supabase access in `/api/*` handlers |
| `DAILY_API_KEY` | Yes (API routes/edge) | Daily room creation from backend |

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Run frontend locally:

```bash
npm run dev
```

## Database Migrations

This repo includes SQL migrations under `supabase/migrations`.

If using Supabase CLI:

```bash
supabase db reset
```

or push to remote:

```bash
supabase db push
```

Important runtime alignment migration:
- `20260307120000_align_runtime_tables.sql` (adds `reservations.room_id`, `lesson_date`, `lesson_time`, and lesson history metadata columns)

## API Endpoints

Server endpoints exposed from `/api/*`:

- `POST /api/create-instant-lesson`
  - Input: `{ studentId }`
  - Output: `{ lessonId, teacherId, roomUrl, roomName }`

- `POST /api/create-reservation`
  - Input: `{ teacherId, studentId, reservationTime, lessonRequest? }`
  - Output: `{ reservationId, lessonId, roomId, roomUrl }`

- `POST /api/update-lesson-status`
  - Input: `{ lessonId, status, endedAt?, recordingUrl? }`
  - Output: `{ success: true, lesson: {...} }`

- `POST /api/create-daily-room`
  - Input: `{ lessonId }`
  - Output: `{ url }`

## Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # production build
npm run preview  # preview build locally
npm run lint     # lint all JS/JSX
npm run test     # run Vitest
```

## Testing

- Test runner: Vitest
- Example test: `src/lib/cn.test.js`

Run:

```bash
npm run test -- --run
```

## Lesson Room / Reservation Flow

- `LessonRoom` supports:
  - `/lesson/:roomId`
  - `/lesson-room/:reservationId`
- Reservation flow resolves:
  - `reservationId -> reservations.room_id -> lessons.id -> lessons.room_url`

If `room_id` is missing, the app creates a reservation lesson room and backfills reservation linkage when possible.

## Deployment Notes

- Frontend can be deployed as a Vite app.
- `/api/*` routes require server runtime env vars (`SUPABASE_SERVICE_ROLE_KEY`, `DAILY_API_KEY`).
- Supabase Edge Function `create-room` can still be used by frontend session utilities.

