# Real-Time Multiplayer Quiz Platform
 
A Kahoot-style live quiz platform built from scratch to explore modern backend system design patterns: REST APIs, WebSocket-based real-time communication, relational data modeling, and fast in-memory ranking with Redis.
 
> 🚧 **Status: Early development.** Currently implementing authentication and core API structure. This README will be updated as new features are completed.
 
## Why this project
 
Built as a self-directed learning project to explore and master:
- Designing a scalable relational schema for a multi-entity domain (users, quizzes, sessions, participants, answers)
- Real-time architecture patterns using Socket.IO — rooms, event broadcasting, and presence management
- Strategic use of Redis for ephemeral, rank-ordered data (leaderboards) while maintaining PostgreSQL as the single source of truth
- Clean, feature-based backend architecture with separation of concerns instead of monolithic routing
## Planned Features
 
- [ ] JWT-based authentication with role-based access control (host/player)
- [ ] Hosts create and manage quizzes with multiple-choice questions
- [ ] Hosts start a session and generate a shareable room code
- [ ] Players join a room using the code
- [ ] Real-time synchronized question delivery with countdown timer
- [ ] Live answer submission with server-side validation
- [ ] Adaptive scoring based on correctness and response speed
- [ ] Live leaderboard per room, powered by Redis Sorted Sets
- [ ] Complete answer history persisted in PostgreSQL
## Tech Stack
 
- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Redis, Socket.IO, JWT
- **Frontend:** React (planned)
 
## Architecture Overview
 
- **PostgreSQL** — System of record: users, quizzes, questions, sessions, participants, and answer history
- **Redis** — Fast-changing real-time state: live per-room leaderboards (Sorted Sets) and active session state
- **Socket.IO** — Real-time transport layer: room join/leave events, question broadcasts, and live leaderboard updates
- **Express (REST)** — Authentication, CRUD operations for non-real-time resources, and session management

### Directory Structure

```
backend/
  src/
    app.ts           # Express application setup + middleware + route mounting
    server.ts        # Entry point — initializes and starts the HTTP server
    config/          # Database connection, environment validation
    shared/          # Cross-feature middleware, error types, shared utilities
    auth/            # Authentication feature (routes, controller, service, model)
    users/           # User management feature
    ...              # Additional feature modules (quizzes, sessions, sockets)
frontend/            # React client (coming later)
```
 
## Local Setup
 
### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- Redis (v6+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd live-quiz-platform

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# Start the development server
npm run dev
```

For database migrations and detailed setup instructions, see [SETUP.md](./SETUP.md) (coming soon).
 
## Roadmap

### Milestones

1. **Core Infrastructure** — Authentication + project skeleton with feature-based architecture
2. **Quiz Management** — Host capabilities to create, edit, and manage quizzes with questions
3. **Session Lifecycle** — REST endpoints for room codes, joining, and session management
4. **Real-Time Foundation** — Socket.IO room mechanics with join/leave events and broadcasting
5. **Scoring & Leaderboards** — Real-time answer submission, server-side validation, and Redis-backed rankings
6. **Frontend** — React client for hosting and playing quizzes
7. **Production Ready** — Reconnection handling, rate limiting, error recovery, and deployment
## License
 
MIT License — See [LICENSE](./LICENSE) file for details.