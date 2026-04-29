-- Supabase Database Schema for "Thợ Sửa Chữa" App

-- 1. Profiles Table
-- Stores user information for both customers and workers.
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  photo_url TEXT,
  role TEXT CHECK (role IN ('customer', 'worker')),
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  services TEXT[], -- Array of service IDs (e.g., ['electrical', 'plumbing'])
  is_online BOOLEAN DEFAULT false,
  location JSONB, -- { lat: number, lng: number }
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Service Requests Table
-- Stores bookings made by customers.
CREATE TABLE service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')) DEFAULT 'pending',
  price DECIMAL,
  location JSONB, -- { lat: number, lng: number, address: string }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat Messages Table
-- Stores real-time communication between customers and workers.
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reviews Table
-- Stores feedback for workers.
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscriptions Table
-- Stores premium status for workers.
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- 'basic', 'pro', 'premium'
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Examples:
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on service_requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Allow customers to see their own requests
CREATE POLICY "Customers can see own requests" ON service_requests
  FOR SELECT USING (auth.uid() = customer_id);

-- Allow workers to see requests assigned to them
CREATE POLICY "Workers can see assigned requests" ON service_requests
  FOR SELECT USING (auth.uid() = worker_id);
