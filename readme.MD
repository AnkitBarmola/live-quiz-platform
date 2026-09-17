# Real-Time Multiplayer Quiz Platform

A Kahoot-style live quiz platform built from scratch to explore modern backend system design patterns: REST APIs, WebSocket-based real-time communication, relational data modeling, and fast in-memory ranking with Redis.

> ✅ **Backend complete.** Authentication, quiz/question CRUD, session lifecycle, real-time gameplay (Socket.IO), and Redis-backed live scoring/leaderboards are all built and tested. Frontend is next.

## Why this project

Built as a self-directed learning project (no tutorials) to explore and master:
- Designing a relational schema for a multi-entity domain (users, quizzes, questions, participants, answers)
- Real-time architecture patterns using Socket.IO — rooms, event broadcasting, and presence management
- Strategic use of Redis for ephemeral, rank-ordered data (leaderboards) while maintaining PostgreSQL as the single source of truth
- Clean, feature-based backend architecture with separation of concerns (routes → middleware → controller → service) instead of monolithic routing
- Authentication vs. authorization as distinct concerns — JWT identity checks vs. resource-ownership checks
- Server-authoritative timing: scoring is computed from server-side timestamps, never trusted from the client

## Features

- [x] JWT-based authentication (register / login)
- [x] Hosts create quizzes and add multiple-choice questions
- [x] Ownership-based authorization (a host can only modify/view their own quizzes)
- [x] Auto-generated, collision-resistant room codes
- [x] Hosts start a session; players join a room using the code (lobby, pre-start only)
- [x] Real-time question delivery over Socket.IO, broadcast to a per-quiz room
- [x] Live answer submission with server-side validation and duplicate-submission prevention
- [x] Scoring based on correctness and response speed (server-timed, not client-trusted)
- [x] Live leaderboard per room, powered by Redis Sorted Sets, broadcast after every answer
- [x] Full answer history persisted in PostgreSQL
- [x] Host-triggered quiz end, with Redis cleanup of ephemeral per-question state
- [ ] React frontend
- [ ] Reconnection handling, rate limiting, deployment (see Roadmap)

## Tech Stack

- **Backend:** Node.js, Express, JavaScript, PostgreSQL, Redis, Socket.IO, JWT
- **Frontend:** React (planned)

## Architecture Overview

- **PostgreSQL** — System of record: users, quizzes, questions, participants, answer history
- **Redis** — Fast-changing real-time state: the active question per quiz (with server start time), per-question "already answered" sets, and the live leaderboard (Sorted Set)
- **Socket.IO** — Real-time transport layer: host/player room join with distinct auth (JWT vs. participant id), question broadcast, private per-player answer results, public leaderboard broadcast
- **Express (REST)** — Authentication, quiz/question CRUD, and the full session lifecycle (create → start → join → end)

### Data Model

A quiz doubles as its own session (one-to-one) rather than supporting reusable quiz templates played across multiple sessions — a deliberate MVP simplification.

- `users` — hosts only; players are anonymous and session-scoped
- `quizzes` — owned by a host, holds a unique `room_code` and lifecycle `status` (`waiting` → `active` → `ended`)
- `questions` — belongs to a quiz; four fixed options (A–D) with a `correct_option` column enforced by a `CHECK` constraint
- `quiz_participants` — anonymous players who join a quiz by room code while it's in `waiting` status
- `answers` — durable answer history: who answered what, how fast, and points awarded

**Known limitations (deliberate MVP tradeoffs):**
- Participants are identified only by the `participant_id` returned at join time, with no token or session binding. Acceptable for a low-stakes, short-lived classroom quiz; would need a lightweight signed token for a more adversarial environment.
- All questions share one fixed time limit (`QUESTION_TIME_LIMIT_MS`) rather than a per-question timer, to keep the MVP scope smaller.
- No reconnection handling yet — a dropped socket loses live state until the next event; the durable record in Postgres is unaffected.

### Directory Structure

```
backend/
  src/
    app.js            # Express application setup + middleware + route mounting
    server.js         # Entry point — loads env vars, starts the HTTP server, Socket.IO setup
    config/           # Database (pg Pool) and Redis client setup
    shared/
      middleware/      # authenticateToken, input validation
    auth/              # Auth feature (routes, controller, service)
    quizzes/           # Quiz, question, session lifecycle, and gameplay feature (routes, controller, service, utils)
  schema.sql           # Full CREATE TABLE statements, version-controlled
frontend/              # React client (coming later)
```

## Local Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (v6+) — via Docker is easiest: `docker run -d --name quiz-redis -p 6379:6379 redis`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd live-quiz-platform/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your own DB/Redis credentials and a JWT secret
# Generate a real random secret with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create the database and load the schema
psql -U postgres -c "CREATE DATABASE quiz_platform;"
psql -U postgres -d quiz_platform -f schema.sql

# Make sure Redis is running (see Prerequisites), then start the server
npm run dev
```

## API Reference

All request/response bodies are JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint                          | Auth required | Description                            |
|--------|------------------------------------|:--------------:|-----------------------------------------|
| POST   | `/api/auth/register`              | No             | Create a host account                   |
| POST   | `/api/auth/login`                 | No             | Log in, receive a JWT                   |
| POST   | `/api/quizzes`                    | Yes            | Create a quiz (generates room code)     |
| GET    | `/api/quizzes/:quizId`            | Yes (owner)    | Get a quiz with its questions           |
| POST   | `/api/quizzes/:quizId/questions`  | Yes (owner)    | Add a question to a quiz                |
| POST   | `/api/quizzes/:quizId/start`      | Yes (owner)    | Start a quiz (`waiting` → `active`)     |
| POST   | `/api/quizzes/:quizId/end`        | Yes (owner)    | End a quiz (`active` → `ended`)         |
| POST   | `/api/quizzes/join`               | No             | Join a quiz by room code (lobby only)   |

### Example: Create Quiz

`POST /api/quizzes` (auth required)
```json
{ "title": "Chapter 5 Review", "description": "Optional description" }
```
→ `201`
```json
{ "quiz": { "id": 2, "host_id": 1, "title": "Chapter 5 Review", "room_code": "GRhGX", "status": "waiting", ... } }
```
Errors: `400` invalid input, `401` missing/invalid token

### Example: Join Quiz

`POST /api/quizzes/join` (no auth)
```json
{ "roomCode": "GRhGX", "displayName": "TestPlayer1" }
```
→ `201`
```json
{ "participant": { "id": 1, "quiz_id": 2, "display_name": "TestPlayer1", "joined_at": "..." } }
```
Errors: `400` invalid input, `404` room code not found, `409` quiz already started/ended

## Socket.IO Events

Connect with `io(url, { auth })`. Hosts authenticate with `{ token }` (their JWT); players authenticate with `{ participantId, quizId }`. Both are placed into a room named after `quizId`.

| Event                    | Direction         | Payload                                          | Notes                                                    |
|---------------------------|--------------------|---------------------------------------------------|------------------------------------------------------------|
| `player-joined`           | server → room       | `{ participantId }`                              | Broadcast when a new player's socket joins the room       |
| `host:start-question`     | host → server        | `{ quizId, questionId }`                         | Host-only; rejected silently if the socket isn't a host    |
| `question:started`        | server → room       | Question, **without** `correct_option`           | Broadcast to everyone, including the host                 |
| `player:submit-answer`    | player → server      | `{ quizId, questionId, selectedOption }`         | Player-only; rejected if already answered or question stale |
| `answer:result`           | server → submitter only | `{ isCorrect, points }`                       | Private feedback, not broadcast                            |
| `leaderboard:update`      | server → room       | `[{ participantId, score }]`, sorted descending  | Broadcast after every scored answer                         |
| `auth-error` / `error-event` | server → socket   | `{ message }`                                    | Connection or event-level failures                          |

## Roadmap

### Milestones

1. ✅ **Core Infrastructure** — Authentication + project skeleton with feature-based architecture
2. ✅ **Quiz Management** — Host capabilities to create quizzes and add questions, with ownership checks
3. ✅ **Session Lifecycle** — REST endpoints for starting/ending a session and players joining by room code
4. ✅ **Real-Time Foundation** — Socket.IO room mechanics for host and player, with distinct auth per role
5. ✅ **Scoring & Leaderboards** — Real-time answer submission, server-timed scoring, Redis-backed live rankings
6. 🔜 **Frontend** — React client for hosting and playing quizzes
7. **Production Ready** — Reconnection handling, rate limiting, error recovery, deployment

## License

MIT License — See [LICENSE](./LICENSE) file for details.