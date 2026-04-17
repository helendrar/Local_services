-- ============================================================
-- Digital ID Local Services Platform - Complete Database Schema
-- Run this file in PostgreSQL: psql -U postgres -f schema.sql
-- ============================================================

CREATE DATABASE localservices;
\c localservices;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'briefcase',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'customer', 'provider')),
  digital_id VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROVIDERS (extends users)
-- ============================================================
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id),
  location_id INT REFERENCES locations(id),
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  years_experience INT DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  document_url VARCHAR(255),
  document_name VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0.00,
  total_ratings INT DEFAULT 0,
  total_jobs_completed INT DEFAULT 0,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id),
  location_id INT REFERENCES locations(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC(10,2),
  urgency VARCHAR(20) DEFAULT 'normal'
    CHECK (urgency IN ('low', 'normal', 'urgent')),
  status VARCHAR(20) DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- JOB ASSIGNMENTS
-- ============================================================
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  responded_at TIMESTAMP,
  provider_note TEXT,
  UNIQUE(job_id, provider_id)
);

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, customer_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_providers_status ON providers(verification_status);
CREATE INDEX idx_providers_category ON providers(category_id);
CREATE INDEX idx_providers_location ON providers(location_id);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_assignments_job ON job_assignments(job_id);
CREATE INDEX idx_assignments_provider ON job_assignments(provider_id);
CREATE INDEX idx_ratings_provider ON ratings(provider_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (name, description, icon) VALUES
  ('Plumbing',    'Pipe repairs, installations, drainage',     'droplets'),
  ('Electrical',  'Wiring, installations, repairs',            'zap'),
  ('Cleaning',    'Home, office and deep cleaning',            'sparkles'),
  ('Carpentry',   'Furniture, fitting, woodwork',              'hammer'),
  ('Painting',    'Interior and exterior painting',            'paintbrush'),
  ('Gardening',   'Landscaping, mowing, planting',             'leaf'),
  ('Tutoring',    'Academic and skill-based tutoring',         'book-open'),
  ('Driving',     'Logistics, errands, transport',             'car'),
  ('Security',    'Guard services, CCTV, patrol',              'shield'),
  ('IT Support',  'Computer repair, networking, setup',        'monitor');

-- Locations
INSERT INTO locations (name, region) VALUES
  ('Nairobi CBD',     'Nairobi County'),
  ('Westlands',       'Nairobi County'),
  ('Kasarani',        'Nairobi County'),
  ('Embakasi',        'Nairobi County'),
  ('Kilimani',        'Nairobi County'),
  ('Mombasa',         'Coast'),
  ('Kisumu',          'Nyanza'),
  ('Nakuru',          'Rift Valley'),
  ('Eldoret',         'Rift Valley'),
  ('Thika',           'Kiambu County');

-- Admin user (password: Admin@1234) — bcrypt hash verified against bcryptjs.compare
INSERT INTO users (full_name, email, password_hash, role, digital_id, phone) VALUES
  ('System Admin', 'admin@localservices.co.ke',
   '$2a$12$Aauv9EXXxYwLaf6ueYLKyemI8NmXS1TqkJiSVUH5f57iS7Bl7kVBW',
   'admin', 'KE-00000001', '+254700000000');
