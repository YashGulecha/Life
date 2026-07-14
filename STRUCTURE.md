# Life OS codebase Structure & Blueprint

This document outlines the directory layout, SQLite schema, authentication flow, and mobile APK build workflow for **Pulse (Life OS)**.

---

## 1. Directory Layout

```text
/home/ubuntu/docker/life/
├── docker-compose.yml           # Multi-container service orchestrator
├── PROPOSAL.md                  # System architecture and concept overview
├── STRUCTURE.md                 # Codebase blueprint & SQLite Schema (This file)
│
├── backend/
│   ├── Dockerfile               # Python/FastAPI environment containerizer
│   ├── main.py                  # Entrypoint for FastAPI
│   ├── requirements.txt         # Package dependencies (fastapi, uvicorn, sqlalchemy, passlib, jose)
│   └── app/
│       ├── __init__.py
│       ├── config.py            # Environment variables loader
│       ├── database.py          # SQLAlchemy SQLite connection & WAL mode config
│       ├── auth.py              # JWT generation, cookie config, password hashing
│       ├── models.py            # SQLite database models
│       ├── schemas.py           # Pydantic data schemas
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── auth.py          # Login / Logout / Register / User state
│       │   ├── command.py       # Smart command router
│       │   ├── health.py        # Log weight, sleep, habits
│       │   ├── academics.py     # Classes, attendance, tasks
│       │   ├── finances.py      # Expenses, budget, net worth
│       │   ├── relations.py     # Personal CRM / contact logs
│       │   └── notes.py         # Markdown wiki notes
│       └── services/
│           └── parser.py        # Simple NLP command parser (regex/tokenizer)
│
└── frontend/
    ├── Dockerfile               # Multi-stage build (Node build -> Nginx static server)
    ├── package.json             # React & Capacitor dependencies
    ├── vite.config.ts           # Vite compile configuration
    ├── capacitor.config.json    # Capacitor native mobile compilation config
    ├── tailwind.config.js       # UI design tokens (if Tailwind is desired)
    ├── index.html               # Main HTML entry point
    └── src/
        ├── main.tsx
        ├── App.tsx              # Routing and primary layout
        ├── index.css            # Base typography, animations, custom scrollbars
        ├── api/                 # Axios/Fetch API wrapper client
        ├── components/
        │   ├── CommandBar.tsx   # Central Smart CLI search & input bar
        │   ├── Dashboard.tsx    # Primary KPI metrics overview
        │   ├── AuthScreen.tsx   # Login page
        │   ├── widgets/         # Micro-views (Health, Finance, Academics, relations, etc.)
        │   └── shared/          # Buttons, modals, input elements
        └── hooks/               # Custom state / API query hooks
```

---

## 2. Relational Database Schema (SQLite)

We propose a unified, clean database structure inside a single file `life.db` using WAL mode for instantaneous read-writes.

```sql
-- User Profile & Settings
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT, -- 2FA secret
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health and Habits Tracker
CREATE TABLE health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    log_date DATE UNIQUE NOT NULL, -- One entry per day containing vitals
    weight REAL,
    water_intake INTEGER DEFAULT 0, -- Glasses/ml
    sleep_duration REAL, -- Hours
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    category TEXT, -- Physical, Mental, Academic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    log_date DATE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(habit_id, log_date)
);

-- Academic Tracker
CREATE TABLE semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL, -- e.g., "Fall 2026"
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semester_id INTEGER REFERENCES semesters(id),
    name TEXT NOT NULL,
    code TEXT,
    target_grade REAL,
    current_grade REAL
);

CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER REFERENCES courses(id),
    title TEXT NOT NULL,
    weight REAL, -- Percentage (e.g., 0.20 for 20%)
    score REAL, -- Achieved grade
    due_date TIMESTAMP,
    status TEXT DEFAULT 'pending' -- pending, completed, overdue
);

-- Finance Tracker
CREATE TABLE net_worth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    assets REAL NOT NULL,
    liabilities REAL NOT NULL,
    recorded_at DATE UNIQUE NOT NULL
);

CREATE TABLE financial_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    amount REAL NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('income', 'expense')),
    category TEXT NOT NULL, -- e.g., Food, Transport, Rent, Academics
    description TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal CRM (Relations)
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    relationship_type TEXT, -- Family, Friend, Mentor
    contact_interval_days INTEGER DEFAULT 14, -- Prompt to contact if interval exceeded
    last_contact_date DATE
);

CREATE TABLE relationship_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relationship_id INTEGER REFERENCES relationships(id),
    log_date DATE NOT NULL,
    notes TEXT
);

-- Wiki & Notes
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title TEXT UNIQUE NOT NULL,
    content TEXT, -- Markdown format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Command Router Implementation Details

The core of the lightweight UX is the parser engine. In `backend/app/services/parser.py`, we implement a simple token router that maps strings to database functions.

### Parsing Logic Example:
*   `/spent 500 food dinner at nando's`
    *   **Action**: `spend`
    *   **Amount**: `500`
    *   **Category**: `food`
    *   **Description**: `dinner at nando's`
*   `/health sleep 7.5`
    *   **Action**: `health`
    *   **Sub-Metric**: `sleep`
    *   **Value**: `7.5`

This router returns structured JSON models that the backend uses to commit state directly to the SQLite database, responding immediately with a confirmation message (e.g., `"Logged: 500 spent on Food (dinner at nando's)"`).

---

## 4. Mobile Compilation Workflow (Capacitor)

To compile the responsive React web application into a manual APK without duplicate codebases:

1.  **Develop & Build Web App**:
    ```bash
    cd frontend
    npm install
    npm run build # Generates static files in `dist/`
    ```
2.  **Initialize Capacitor Android Project**:
    ```bash
    npx cap init "Pulse Life OS" "in.yashgulecha.life" --web-dir=dist
    npx cap add android
    ```
3.  **Sync Web Build to Native Project**:
    Each time the frontend is updated:
    ```bash
    npm run build
    npx cap sync
    ```
4.  **Generate APK**:
    Open the android project in Android Studio or compile via gradle CLI:
    ```bash
    cd android
    ./gradlew assembleDebug # Outputs standard manual debug APK (app-debug.apk)
    ```
    This APK can be directly copied, transferred, and manually installed on any Android device.
