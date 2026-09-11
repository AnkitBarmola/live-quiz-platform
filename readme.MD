# Real-Time Multiplayer Quiz Platform

A Kahoot-style live quiz platform built from scratch to explore modern backend system design patterns: REST APIs, WebSocket-based real-time communication, relational data modeling, and fast in-memory ranking with Redis.

> 🚧 **Status: In development.** Authentication, quiz/question CRUD, and session lifecycle (start/join) are complete. Currently moving into real-time architecture (Socket.IO + Redis).

## Why this project

Built as a self-directed learning project (no tutorials) to explore and master:
- Designing a relational schema for a multi-entity domain (users, quizzes, questions, participants, answers)
- Real-time architecture patterns using Socket.IO — rooms, event broadcasting, and presence management
- Strategic use of Redis for ephemeral, rank-ordered data (leaderboards) while maintaining PostgreSQL as the single source of truth
- Clean, feature-based backend architecture with separation of concerns (routes → middleware → controller → service) instead of monolithic routing
- Authentication vs. authorization as distinct concerns — JWT identity checks vs. resource-ownership checks

## Planned Features

- [x] JWT-based authentication (register / login)
- [x] Hosts create quizzes
- [x] Hosts add multiple-choice questions to their quizzes
- [x] Ownership-based authorization (a host can only modify/view their own quizzes)
- [x] Auto-generated, collision-resistant room codes
- [x] Hosts start a session; players join a room using the code (lobby, pre-start only)
- [ ] Real-time synchronized question delivery with countdown timer
- [ ] Live answer submission with server-side validation
- [ ] Scoring based on correctness and response speed
- [ ] Live leaderboard per room, powered by Redis Sorted Sets
- [ ] Complete answer history persisted in PostgreSQL

## Tech Stack

- **Backend:** Node.js, Express, JavaScript, PostgreSQL, Redis (planned), Socket.IO (planned), JWT
- **Frontend:** React (planned)

## Architecture Overview

- **PostgreSQL** — System of record: users, quizzes, questions, participants, answer history
- **Redis** *(planned)* — Fast-changing real-time state: live per-room leaderboards (Sorted Sets)
- **Socket.IO** *(planned)* — Real-time transport layer: room join/leave events, question broadcasts, live leaderboard updates
- **Express (REST)** — Authentication, quiz/question CRUD, and session lifecycle (built); real-time gameplay (planned)

### Data Model

A quiz doubles as its own session (one-to-one) rather than supporting reusable quiz templates played across multiple sessions — a deliberate MVP simplification.

- `users` — hosts only; players are anonymous and session-scoped
- `quizzes` — owned by a host, holds a unique `room_code` and lifecycle `status` (`waiting` → `active` → `ended`)
- `questions` — belongs to a quiz; four fixed options (A–D) with a `correct_option` column enforced by a `CHECK` constraint
- `quiz_participants` — anonymous players who join a quiz by room code while it's in `waiting` status
- `answers` — durable answer history: who answered what, how fast, and points awarded

**Known limitation (deliberate MVP tradeoff):** participants are identified only by the `participant_id` returned at join time, with no token or session binding. This is acceptable for a low-stakes, short-lived classroom quiz but would need a lightweight signed token (or full auth) to be safe for a more adversarial environment.

### Directory Structure

```
backend/
  src/
    app.js            # Express application setup + middleware + route mounting
    server.js         # Entry point — loads env vars, starts the HTTP server
    config/           # Database connection (pg Pool)
    shared/
      middleware/      # authenticateToken, input validation
    auth/              # Auth feature (routes, controller, service)
    quizzes/           # Quiz, question, and session lifecycle feature (routes, controller, service, utils)
    ...                # More feature modules added as built (sockets)
  schema.sql           # Full CREATE TABLE statements, version-controlled
frontend/              # React client (coming later)
```

## Local Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (v6+) — not yet required, needed starting at the scoring/leaderboard milestone

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd live-quiz-platform/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your own DB credentials and a JWT secret
# Generate a real random secret with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create the database and load the schema
psql -U postgres -c "CREATE DATABASE quiz_platform;"
psql -U postgres -d quiz_platform -f schema.sql

# Start the development server
npm run dev
```

## API Reference

All request/response bodies are JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint                          | Auth required | Description                          |
|--------|------------------------------------|:--------------:|---------------------------------------|
| POST   | `/api/auth/register`              | No             | Create a host account                 |
| POST   | `/api/auth/login`                 | No             | Log in, receive a JWT                 |
| POST   | `/api/quizzes`                    | Yes            | Create a quiz (generates room code)   |
| GET    | `/api/quizzes/:quizId`            | Yes (owner)    | Get a quiz with its questions         |
| POST   | `/api/quizzes/:quizId/questions`  | Yes (owner)    | Add a question to a quiz              |
| POST   | `/api/quizzes/:quizId/start`      | Yes (owner)    | Start a quiz (`waiting` → `active`)   |
| POST   | `/api/quizzes/join`               | No             | Join a quiz by room code (lobby only) |

### Example: Register

`POST /api/auth/register`
```json
{ "username": "ankit123", "email": "ankit@example.com", "password": "password123" }
```
→ `201`
```json
{ "user": { "id": 1, "username": "ankit123", "email": "ankit@example.com", "created_at": "..." } }
```
Errors: `400` invalid input, `409` username/email already exists

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

## Roadmap

### Milestones

1. ✅ **Core Infrastructure** — Authentication + project skeleton with feature-based architecture
2. ✅ **Quiz Management** — Host capabilities to create quizzes and add questions, with ownership checks
3. ✅ **Session Lifecycle** — REST endpoints for starting a session and players joining by room code
4. 🔜 **Real-Time Foundation** — Socket.IO room mechanics with join/leave events and broadcasting
5. **Scoring & Leaderboards** — Real-time answer submission, server-side validation, Redis-backed rankings
6. **Frontend** — React client for hosting and playing quizzes
7. **Production Ready** — Reconnection handling, rate limiting, error recovery, deployment

## License

MIT License — See [LICENSE](./LICENSE) file for details.