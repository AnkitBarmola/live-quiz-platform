# Real-Time Multiplayer Quiz Platform
 
A Kahoot-style live quiz platform built from scratch to explore backend system
design: REST APIs, WebSocket-based real-time communication, relational data
modeling, and fast in-memory ranking with Redis.
 
> 🚧 **Status: Early development.** Currently scaffolding auth and core API
> structure. This README will grow as features land.
 
## Why this project
 
Built as a self-directed learning project (no tutorials) to go deep on:
- Designing a relational schema for a multi-entity domain (users, quizzes,
  sessions, participants, answers)
- Real-time architecture with Socket.IO — rooms, broadcast events, presence
- Using Redis for what it's good at (fast, ephemeral, rank-ordered data) while
  keeping Postgres as the source of truth
- Clean, feature-based backend architecture instead of a single monolithic
  routes file
## Planned Features
 
- [ ] JWT-based authentication (host/player roles)
- [ ] Hosts create quizzes with multiple-choice questions
- [ ] Host starts a session and gets a shareable room code
- [ ] Players join a room via code
- [ ] Synchronized question delivery with countdown timer
- [ ] Real-time answer submission and server-side validation
- [ ] Scoring based on correctness **and** response speed
- [ ] Live leaderboard per room, powered by Redis Sorted Sets
- [ ] Full answer history persisted in Postgres
## Tech Stack
 
**Backend:** Node.js, Express, TypeScript, PostgreSQL, Redis, Socket.IO, JWT
**Frontend:** React (planned)
 
## Architecture Overview
 
- **PostgreSQL** — system of record: users, quizzes, questions, sessions,
  participants, answer history.
- **Redis** — fast-changing real-time state only: live per-room leaderboards
  (Sorted Sets), and potentially active room/session state.
- **Socket.IO** — real-time transport layer: room join/leave events, question
  broadcast, live leaderboard push after each question.
- **Express (REST)** — auth, quiz CRUD, and any non-real-time operations.
```
backend/
  src/
    app.ts          # Express app + middleware + route mounting
    server.ts        # Entry point — starts the HTTP server
    config/           # DB connection, env validation
    shared/          # Cross-feature middleware, error types, shared types
    auth/            # Auth feature (routes, controller, service, model)
    users/           # User feature
    ...              # More feature folders added as built (quizzes, sessions, sockets)
frontend/            # React client (added later)
```
 
## Local Setup
 
> Setup instructions will be filled in as the project stabilizes (env vars,
> DB migrations, running Postgres/Redis locally).
 
```bash
cd backend
npm install
npm run dev
```
 
## Roadmap / Milestones
 
1. Auth + project skeleton
2. Quiz CRUD (host creates quizzes & questions)
3. Quiz session lifecycle (REST only — room codes, joining)
4. Socket.IO room mechanics (join/broadcast/presence)
5. Real-time answer submission, scoring, Redis leaderboard
6. React frontend
7. Hardening — reconnection handling, rate limiting, failure recovery
## License
 
TBD