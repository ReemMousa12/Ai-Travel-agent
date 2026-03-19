-- Travel Agent Database Schema (Complete with User Preferences)

-- Table: user_preferences
-- Store user's travel style, budget, and interests
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    current_location TEXT,
    current_country TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    preferred_travel_style TEXT, -- 'adventure', 'relaxation', 'culture', 'luxury', 'budget'
    preferred_budget DECIMAL(10, 2),
    preferred_activities TEXT[], -- ['beach', 'hiking', 'museums', 'nightlife', 'shopping', 'food', 'adventure']
    dietary_restrictions TEXT[],
    travel_pace TEXT, -- 'slow', 'moderate', 'fast'
    group_type TEXT, -- 'solo', 'couple', 'family', 'friends'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: user_profiles
-- Store user information
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    home_city TEXT,
    home_country TEXT,
    profile_image TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: trips
-- Store planned trips
CREATE TABLE trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    destination_country TEXT,
    destination_lat DECIMAL(10, 8),
    destination_lon DECIMAL(11, 8),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10, 2),
    trip_style TEXT,
    description TEXT,
    trip_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: saved_items
-- Save flights, hotels, activities, restaurants
CREATE TABLE saved_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'flight', 'hotel', 'activity', 'restaurant'
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    country TEXT,
    price DECIMAL(10, 2),
    rating DECIMAL(2, 1),
    item_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: chat_history
-- Store conversation history
CREATE TABLE chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant'
    context_data JSONB, -- Store location, preferences used in response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: nearby_destinations
-- Cache nearby countries/cities for quick lookup
CREATE TABLE nearby_destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_country TEXT NOT NULL,
    nearby_country TEXT NOT NULL,
    distance_km DECIMAL(10, 2),
    travel_time_hours DECIMAL(5, 1),
    popularity_score DECIMAL(3, 1),
    best_season TEXT,
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_destination_country ON trips(destination_country);
CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_trip_id ON saved_items(trip_id);
CREATE INDEX idx_saved_items_country ON saved_items(country);
CREATE INDEX idx_saved_items_item_type ON saved_items(item_type);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_trip_id ON chat_history(trip_id);
CREATE INDEX idx_nearby_destinations_user_country ON nearby_destinations(user_country);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_destinations ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow all for now - add auth checks in production)
CREATE POLICY "Allow all access to user_preferences" ON user_preferences FOR ALL USING (true);
CREATE POLICY "Allow all access to user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all access to trips" ON trips FOR ALL USING (true);
CREATE POLICY "Allow all access to saved_items" ON saved_items FOR ALL USING (true);
CREATE POLICY "Allow all access to chat_history" ON chat_history FOR ALL USING (true);
CREATE POLICY "Allow all access to nearby_destinations" ON nearby_destinations FOR ALL USING (true);

-- Insert nearby destinations reference data
INSERT INTO nearby_destinations (user_country, nearby_country, distance_km, travel_time_hours, popularity_score, best_season, notes) VALUES
('USA', 'Mexico', 300, 4, 9.0, 'Oct-Apr', 'Close, warm, beaches'),
('USA', 'Canada', 200, 3, 8.5, 'May-Sep', 'Natural beauty'),
('USA', 'Costa Rica', 2200, 5, 8.0, 'Dec-Apr', 'Tropical'),
('UK', 'France', 500, 3, 9.5, 'May-Sep', 'Culture, food'),
('UK', 'Spain', 1200, 4, 9.0, 'Jun-Sep', 'Beaches, culture'),
('UK', 'Germany', 800, 3, 8.0, 'May-Oct', 'History, beer'),
('India', 'Nepal', 800, 8, 8.5, 'Oct-Nov', 'Mountains'),
('India', 'Thailand', 1500, 4, 8.0, 'Nov-Feb', 'Tropical, beaches'),
('India', 'Sri Lanka', 1600, 3, 8.5, 'Dec-Feb', 'Beaches, tea'),
('Germany', 'Austria', 600, 3, 9.0, 'May-Oct', 'Mountains, culture'),
('Germany', 'Czech Republic', 400, 3, 8.5, 'May-Sep', 'History, beer'),
('Australia', 'New Zealand', 2000, 3, 9.5, 'Dec-Feb', 'Adventure, nature'),
('Japan', 'South Korea', 1400, 3, 8.5, 'May-Oct', 'Culture, food'),
('Brazil', 'Argentina', 1800, 3, 8.0, 'Nov-Mar', 'Cities, nature');
