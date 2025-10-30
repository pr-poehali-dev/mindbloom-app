CREATE TABLE IF NOT EXISTS mood_entries (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    sleep_hours NUMERIC(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
    activities TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);
CREATE INDEX idx_mood_entries_created ON mood_entries(created_at DESC);

INSERT INTO mood_entries (user_id, entry_date, mood, sleep_hours, stress_level, activities, notes) VALUES
('default_user', CURRENT_DATE - INTERVAL '6 days', 7, 7.5, 4, ARRAY['walk', 'reading'], 'Хороший день, была прогулка в парке'),
('default_user', CURRENT_DATE - INTERVAL '5 days', 6, 6.0, 6, ARRAY['none'], 'Мало спал, чувствую усталость'),
('default_user', CURRENT_DATE - INTERVAL '4 days', 8, 8.0, 3, ARRAY['yoga', 'meditation'], 'Отличная утренняя йога!'),
('default_user', CURRENT_DATE - INTERVAL '3 days', 7, 7.0, 4, ARRAY['walk', 'workout'], 'Тренировка была сложной но приятной'),
('default_user', CURRENT_DATE - INTERVAL '2 days', 9, 8.5, 2, ARRAY['walk', 'yoga', 'reading'], 'Прекрасный день, всё получалось'),
('default_user', CURRENT_DATE - INTERVAL '1 day', 8, 8.0, 3, ARRAY['meditation', 'walk'], 'Спокойный день, хорошо отдохнул'),
('default_user', CURRENT_DATE, 7, 7.0, 5, ARRAY['reading'], 'Обычный день')
ON CONFLICT (user_id, entry_date) DO NOTHING;