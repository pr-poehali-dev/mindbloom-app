CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'trial',
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 days',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

INSERT INTO subscriptions (user_id, plan, status, trial_start_date, trial_end_date) VALUES
('default_user', 'free', 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 days')
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE subscriptions IS 'User subscriptions with trial and paid plans';
COMMENT ON COLUMN subscriptions.status IS 'Possible values: trial, active, expired, cancelled';
COMMENT ON COLUMN subscriptions.plan IS 'Possible values: free, pro';