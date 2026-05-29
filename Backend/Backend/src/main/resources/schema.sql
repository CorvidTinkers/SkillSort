-- Enable foreign key support in SQLite
PRAGMA foreign_keys = ON;

-- 1. Users Table (SSO-registered users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- SSO or system credentials user unique ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT, -- Hash for credential users, NULL for SSO users
    sso_provider TEXT DEFAULT 'google',
    avatar_url TEXT,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Runs Table (Groups candidates into batches)
CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 3. Candidates Table (Isolated by uploaded_by user and grouped by run_id)
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    run_id INTEGER NOT NULL,
    uploaded_by TEXT NOT NULL,
    filename TEXT NOT NULL,
    extracted_text TEXT,
    ats_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
);

-- 3. Candidate Attributes Table (Dynamic AI extracted fields)
CREATE TABLE IF NOT EXISTS candidate_attributes (
    candidate_id TEXT NOT NULL,
    attribute_key TEXT NOT NULL,
    attribute_value TEXT,
    confidence TEXT,
    PRIMARY KEY (candidate_id, attribute_key),
    FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
);

-- 4. Candidate Knockout Criteria Results Table
CREATE TABLE IF NOT EXISTS candidate_knockouts (
    candidate_id TEXT NOT NULL,
    criteria TEXT NOT NULL,
    passed INTEGER NOT NULL, -- 0 for false, 1 for true
    PRIMARY KEY (candidate_id, criteria),
    FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
);

-- 5. Candidate Documents Table (Vertical Partitioning for PDF BLOB storage)
CREATE TABLE IF NOT EXISTS candidate_documents (
    candidate_id TEXT PRIMARY KEY,
    file_content BLOB NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT DEFAULT 'application/pdf',
    FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_user ON candidates (uploaded_by);
