CREATE TABLE IF NOT EXISTS session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL,
    total_clients_joined INT NOT NULL DEFAULT 0,
    peak_clients INT NOT NULL DEFAULT 0,
    blacklisted_count INT NOT NULL DEFAULT 0,
    end_reason VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_history_tour_id ON session_history(tour_id);
CREATE INDEX IF NOT EXISTS idx_session_history_owner_id ON session_history(owner_id);
