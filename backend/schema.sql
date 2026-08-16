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

CREATE TABLE questions (
    id              SERIAL PRIMARY KEY,
    quiz_id         INTEGER NOT NULL REFERENCES quizzes(id),
    question_text   TEXT NOT NULL,
    option_a        VARCHAR(255) NOT NULL,
    option_b        VARCHAR(255) NOT NULL,
    option_c        VARCHAR(255) NOT NULL,
    option_d        VARCHAR(255) NOT NULL,
    correct_option  CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_participants (
    id            SERIAL PRIMARY KEY,
    quiz_id       INTEGER NOT NULL REFERENCES quizzes(id),
    display_name  VARCHAR(50) NOT NULL,
    joined_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
    id                SERIAL PRIMARY KEY,
    quiz_id           INTEGER NOT NULL REFERENCES quizzes(id),
    participant_id    INTEGER NOT NULL REFERENCES quiz_participants(id),
    question_id       INTEGER NOT NULL REFERENCES questions(id),
    selected_option   CHAR(1) NOT NULL CHECK (selected_option IN ('A','B','C','D')),
    is_correct        BOOLEAN NOT NULL,
    response_time_ms  INTEGER NOT NULL,
    points_awarded    INTEGER NOT NULL,
    answered_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
