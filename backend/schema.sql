CREATE TABLE quizzes (
    id           SERIAL PRIMARY KEY,
    host_id      INTEGER NOT NULL REFERENCES users(id),
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    room_code    VARCHAR(10) NOT NULL UNIQUE,
    status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at   TIMESTAMP,
    ended_at     TIMESTAMP
);
