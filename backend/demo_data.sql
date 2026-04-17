-- ═══════════════════════════════════════════════════════════════
--  LocalServices — Complete Demo Dataset
--  
--  Load this AFTER schema.sql has been run successfully.
--  
--  Run:  psql -U postgres -d localservices -f demo_data.sql
--  
--  All demo accounts use the password: Demo@1234
--  (bcrypt hash: $2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO)
--
--  Admin account (already exists from schema.sql):
--    admin@localservices.co.ke / Admin@1234
-- ═══════════════════════════════════════════════════════════════

-- Clean previous demo data (safe - only removes demo users, keeps admin)
DELETE FROM ratings          WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke');
DELETE FROM ratings          WHERE provider_id IN (SELECT id FROM providers WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke'));
DELETE FROM job_assignments  WHERE job_id IN (SELECT id FROM jobs WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke'));
DELETE FROM job_assignments  WHERE provider_id IN (SELECT id FROM providers WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke'));
DELETE FROM jobs             WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke');
DELETE FROM notifications    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke');
DELETE FROM activity_logs    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke');
DELETE FROM providers        WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke');
DELETE FROM users            WHERE email LIKE '%@demo.co.ke';


-- ═══════════════════════════════════════════════════════════════
-- CUSTOMERS — 4 accounts
-- ═══════════════════════════════════════════════════════════════

INSERT INTO users (full_name, email, password_hash, role, digital_id, phone, is_active) VALUES
  ('Amina Hassan',    'amina.hassan@demo.co.ke',    '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'customer', '34567891', '+254712345001', true),
  ('Brian Otieno',    'brian.otieno@demo.co.ke',    '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'customer', '34567892', '+254722345002', true),
  ('Catherine Njeri', 'catherine.njeri@demo.co.ke', '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'customer', '34567893', '+254733345003', true),
  ('David Kiprop',    'david.kiprop@demo.co.ke',    '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'customer', '34567894', '+254712345004', true);


-- ═══════════════════════════════════════════════════════════════
-- PROVIDERS — 8 accounts (varied verification statuses)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO users (full_name, email, password_hash, role, digital_id, phone, is_active) VALUES
  -- VERIFIED providers (6) — different categories/locations
  ('James Mwangi',    'james.mwangi@demo.co.ke',    '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456781', '+254701000001', true),
  ('Peter Kamau',     'peter.kamau@demo.co.ke',     '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456782', '+254701000002', true),
  ('Grace Wanjiku',   'grace.wanjiku@demo.co.ke',   '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456783', '+254701000003', true),
  ('Samuel Odhiambo', 'samuel.odhiambo@demo.co.ke', '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456784', '+254701000004', true),
  ('Lucy Atieno',     'lucy.atieno@demo.co.ke',     '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456785', '+254701000005', true),
  ('Michael Ochieng', 'michael.ochieng@demo.co.ke', '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456786', '+254701000006', true),

  -- PENDING provider (awaiting verification — admin will approve during demo)
  ('Ruth Chebet',     'ruth.chebet@demo.co.ke',     '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456787', '+254701000007', true),

  -- TO-BE-REJECTED provider (admin will reject during demo)
  ('Joseph Mutua',    'joseph.mutua@demo.co.ke',    '$2a$12$2y5ZYHKj5nVOzWdFk8e0J.qTqF/7zIvMWlKmGqWZUXsXpdYZFvJCO', 'provider', '23456788', '+254701000008', true);


-- ═══════════════════════════════════════════════════════════════
-- PROVIDER PROFILES — category, location, bio, skills, rates
-- ═══════════════════════════════════════════════════════════════

-- James Mwangi — PLUMBER, Nairobi CBD, highly rated
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Certified plumber with over 7 years of hands-on experience. I handle emergency repairs, pipe installations, and full bathroom fittings. Always on time, fair prices, clean work.',
  ARRAY['Pipe fitting', 'Leak detection', 'Drain unblocking', 'Water heater install', 'Bathroom fittings'],
  7, 800.00, 'verified', 4.80, 15, 22, NOW() - INTERVAL '2 months',
  '/uploads/demo-james-id.pdf', 'National_ID_Mwangi.pdf'
FROM users u, categories c, locations l
WHERE u.email = 'james.mwangi@demo.co.ke' AND c.name = 'Plumbing' AND l.name = 'Nairobi CBD';

-- Peter Kamau — ELECTRICIAN, Westlands, senior
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Licensed electrician specializing in residential and commercial wiring. I do panel upgrades, generator installation, and solar setups. Work is inspected and warrantied.',
  ARRAY['Wiring', 'Panel upgrades', 'Generator install', 'Solar setup', 'Fault diagnosis'],
  10, 1200.00, 'verified', 4.95, 28, 41, NOW() - INTERVAL '4 months',
  '/uploads/demo-peter-id.pdf', 'EPRA_Certificate_Kamau.pdf'
FROM users u, categories c, locations l
WHERE u.email = 'peter.kamau@demo.co.ke' AND c.name = 'Electrical' AND l.name = 'Westlands';

-- Grace Wanjiku — CLEANER, Kilimani, popular
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Professional cleaning lady offering home, office, and move-in deep cleaning services. I bring my own supplies — safe, eco-friendly products. Trusted by 50+ Kilimani families.',
  ARRAY['Deep cleaning', 'Move-in cleaning', 'Office cleaning', 'Laundry', 'Ironing'],
  5, 500.00, 'verified', 4.60, 22, 35, NOW() - INTERVAL '3 months',
  '/uploads/demo-grace-id.jpg', 'ID_Wanjiku.jpg'
FROM users u, categories c, locations l
WHERE u.email = 'grace.wanjiku@demo.co.ke' AND c.name = 'Cleaning' AND l.name = 'Kilimani';

-- Samuel Odhiambo — CARPENTER, Kasarani, mid-career
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Skilled carpenter making custom furniture, kitchen cabinets, and wardrobes. I work with mahogany, mvule, and engineered wood. Free site measurement and design consultation.',
  ARRAY['Custom furniture', 'Kitchen cabinets', 'Wardrobes', 'Door installation', 'Wood finishing'],
  6, 900.00, 'verified', 4.40, 11, 18, NOW() - INTERVAL '5 weeks',
  '/uploads/demo-samuel-id.pdf', 'Trade_Cert_Odhiambo.pdf'
FROM users u, categories c, locations l
WHERE u.email = 'samuel.odhiambo@demo.co.ke' AND c.name = 'Carpentry' AND l.name = 'Kasarani';

-- Lucy Atieno — TUTOR, Kilimani, English/Math
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Qualified teacher (BEd, KNEC trained) offering home tutoring for primary and secondary students. Specialties: English, Mathematics, and KCSE prep. Results-focused.',
  ARRAY['Primary tutoring', 'KCSE prep', 'English language', 'Mathematics', 'Homework help'],
  8, 1000.00, 'verified', 4.90, 18, 27, NOW() - INTERVAL '2 months',
  '/uploads/demo-lucy-id.pdf', 'Teaching_License_Atieno.pdf'
FROM users u, categories c, locations l
WHERE u.email = 'lucy.atieno@demo.co.ke' AND c.name = 'Tutoring' AND l.name = 'Kilimani';

-- Michael Ochieng — IT SUPPORT, Mombasa, tech professional
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, avg_rating, total_ratings, total_jobs_completed, verified_at, document_url, document_name)
SELECT u.id, c.id, l.id,
  'IT technician for homes and small businesses. Laptop repair, virus removal, Wi-Fi setup, CCTV installation. Same-day service for most issues. Mombasa-based, willing to travel.',
  ARRAY['Laptop repair', 'Wi-Fi setup', 'Virus removal', 'CCTV installation', 'Data recovery'],
  4, 700.00, 'verified', 4.30, 9, 14, NOW() - INTERVAL '6 weeks',
  '/uploads/demo-michael-id.jpg', 'National_ID_Ochieng.jpg'
FROM users u, categories c, locations l
WHERE u.email = 'michael.ochieng@demo.co.ke' AND c.name = 'IT Support' AND l.name = 'Mombasa';

-- Ruth Chebet — PENDING (awaits admin verification in demo)
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, hourly_rate, verification_status, document_url, document_name)
SELECT u.id, c.id, l.id,
  'Experienced painter covering both interior and exterior projects. I use premium Crown and Basco paints. Apartments, houses, offices. Quote within 24 hours of site visit.',
  ARRAY['Interior painting', 'Exterior painting', 'Wallpaper removal', 'Color consultation'],
  5, 600.00, 'pending',
  '/uploads/demo-ruth-id.jpg', 'National_ID_Chebet.jpg'
FROM users u, categories c, locations l
WHERE u.email = 'ruth.chebet@demo.co.ke' AND c.name = 'Painting' AND l.name = 'Nakuru';

-- Joseph Mutua — PENDING with weak profile (to be rejected in demo)
INSERT INTO providers (user_id, category_id, location_id, bio, skills, years_experience, verification_status, document_url, document_name)
SELECT u.id, c.id, l.id,
  'i do jobs',
  ARRAY['any work'],
  1, 'pending',
  '/uploads/demo-joseph-id.jpg', 'photo.jpg'
FROM users u, categories c, locations l
WHERE u.email = 'joseph.mutua@demo.co.ke' AND c.name = 'Gardening' AND l.name = 'Eldoret';


-- ═══════════════════════════════════════════════════════════════
-- JOBS — Mix of statuses for demo
-- ═══════════════════════════════════════════════════════════════

-- COMPLETED jobs (already rated)
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Fix dripping bathroom tap',
  'The main bathroom tap has been dripping for a week. I need it replaced or repaired as soon as possible. Also check the shower head which has low water pressure.',
  1500.00, 'normal', 'completed', NOW() - INTERVAL '10 days'
FROM users u, categories c, locations l
WHERE u.email = 'amina.hassan@demo.co.ke' AND c.name = 'Plumbing' AND l.name = 'Nairobi CBD';

INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Install ceiling light in living room',
  'I bought a new chandelier and need it professionally installed in the living room. The old fitting should be removed and properly capped. Ceiling is 10 feet high.',
  2500.00, 'normal', 'completed', NOW() - INTERVAL '14 days'
FROM users u, categories c, locations l
WHERE u.email = 'brian.otieno@demo.co.ke' AND c.name = 'Electrical' AND l.name = 'Westlands';

INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Weekly office cleaning — small firm',
  'Small law firm office, 4 rooms plus reception. Need deep cleaning once a week. Windows, desks, kitchenette, 2 toilets. Evening hours preferred (after 6pm).',
  2000.00, 'normal', 'completed', NOW() - INTERVAL '20 days'
FROM users u, categories c, locations l
WHERE u.email = 'catherine.njeri@demo.co.ke' AND c.name = 'Cleaning' AND l.name = 'Kilimani';


-- IN-PROGRESS job (already assigned & accepted)
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Build custom kitchen cabinets',
  'Need custom kitchen cabinets made and installed. Kitchen is 4m x 3m. Prefer mvule wood with a dark finish. I have the design ready. Timeline: 2-3 weeks.',
  45000.00, 'normal', 'assigned', NOW() - INTERVAL '3 days'
FROM users u, categories c, locations l
WHERE u.email = 'david.kiprop@demo.co.ke' AND c.name = 'Carpentry' AND l.name = 'Kasarani';


-- OPEN job — for DEMO: "customer assigns provider" scenario
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'KCSE Math tutoring for my son',
  'My son is in Form 4 and struggling with Mathematics (especially calculus and statistics). Need an experienced KCSE tutor to visit our home twice a week. Exams in 3 months.',
  3000.00, 'urgent', 'open', NOW() - INTERVAL '1 day'
FROM users u, categories c, locations l
WHERE u.email = 'amina.hassan@demo.co.ke' AND c.name = 'Tutoring' AND l.name = 'Kilimani';


-- OPEN job — for DEMO: "provider will REJECT this" scenario
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Emergency — no power in house',
  'The whole house lost power this morning. KPLC says the supply is fine so it must be internal. Need an electrician today if possible. Cannot work from home without power.',
  3500.00, 'urgent', 'open', NOW() - INTERVAL '4 hours'
FROM users u, categories c, locations l
WHERE u.email = 'brian.otieno@demo.co.ke' AND c.name = 'Electrical' AND l.name = 'Westlands';


-- OPEN job — cleaning, for demo flexibility
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Post-renovation deep cleaning',
  'Just finished renovating my 2-bedroom apartment. Dust everywhere, paint splatters, construction debris. Need full deep clean before I move in next weekend.',
  4000.00, 'normal', 'open', NOW() - INTERVAL '2 days'
FROM users u, categories c, locations l
WHERE u.email = 'catherine.njeri@demo.co.ke' AND c.name = 'Cleaning' AND l.name = 'Kilimani';


-- OPEN job — IT Support
INSERT INTO jobs (customer_id, category_id, location_id, title, description, budget, urgency, status, created_at)
SELECT u.id, c.id, l.id,
  'Install home CCTV system (4 cameras)',
  'Want to install 4 outdoor CCTV cameras around my compound with night vision and mobile app access. I have a small business storage nearby so I also need the system to cover that.',
  15000.00, 'low', 'open', NOW() - INTERVAL '5 days'
FROM users u, categories c, locations l
WHERE u.email = 'david.kiprop@demo.co.ke' AND c.name = 'IT Support' AND l.name = 'Mombasa';


-- ═══════════════════════════════════════════════════════════════
-- ASSIGNMENTS — For completed + in-progress jobs
-- ═══════════════════════════════════════════════════════════════

-- Amina's completed plumbing job → James Mwangi
INSERT INTO job_assignments (job_id, provider_id, status, assigned_at, responded_at)
SELECT j.id, p.id, 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days 1 hour'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'james.mwangi@demo.co.ke')
WHERE cu.email = 'amina.hassan@demo.co.ke' AND j.title = 'Fix dripping bathroom tap';

-- Brian's completed electrical job → Peter Kamau
INSERT INTO job_assignments (job_id, provider_id, status, assigned_at, responded_at)
SELECT j.id, p.id, 'completed', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days 30 minutes'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'peter.kamau@demo.co.ke')
WHERE cu.email = 'brian.otieno@demo.co.ke' AND j.title = 'Install ceiling light in living room';

-- Catherine's completed cleaning job → Grace Wanjiku
INSERT INTO job_assignments (job_id, provider_id, status, assigned_at, responded_at)
SELECT j.id, p.id, 'completed', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days 2 hours'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'grace.wanjiku@demo.co.ke')
WHERE cu.email = 'catherine.njeri@demo.co.ke' AND j.title = 'Weekly office cleaning — small firm';

-- David's IN-PROGRESS carpentry job → Samuel Odhiambo (accepted but not complete)
INSERT INTO job_assignments (job_id, provider_id, status, assigned_at, responded_at, provider_note)
SELECT j.id, p.id, 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days 3 hours',
  'I can start next Monday. Will visit your place this weekend to take measurements and finalize the design.'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'samuel.odhiambo@demo.co.ke')
WHERE cu.email = 'david.kiprop@demo.co.ke' AND j.title = 'Build custom kitchen cabinets';


-- ═══════════════════════════════════════════════════════════════
-- RATINGS — For completed jobs only
-- ═══════════════════════════════════════════════════════════════

-- Amina rates James Mwangi (plumber) — 5 stars
INSERT INTO ratings (job_id, customer_id, provider_id, score, comment, created_at)
SELECT j.id, cu.id, p.id, 5,
  'James arrived within an hour of my call and fixed the problem quickly. Very professional and explained what was wrong. Fair pricing too. Highly recommend!',
  NOW() - INTERVAL '8 days'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'james.mwangi@demo.co.ke')
WHERE cu.email = 'amina.hassan@demo.co.ke' AND j.title = 'Fix dripping bathroom tap';

-- Brian rates Peter Kamau (electrician) — 5 stars
INSERT INTO ratings (job_id, customer_id, provider_id, score, comment, created_at)
SELECT j.id, cu.id, p.id, 5,
  'Excellent work! Peter installed the chandelier cleanly and made sure the wiring was safe. He also noticed a loose connection in my kitchen and fixed it at no extra cost.',
  NOW() - INTERVAL '12 days'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'peter.kamau@demo.co.ke')
WHERE cu.email = 'brian.otieno@demo.co.ke' AND j.title = 'Install ceiling light in living room';

-- Catherine rates Grace Wanjiku (cleaner) — 4 stars
INSERT INTO ratings (job_id, customer_id, provider_id, score, comment, created_at)
SELECT j.id, cu.id, p.id, 4,
  'Good cleaning service, office smells fresh and looks great. Only reason for 4 stars is she was 30 min late on the first visit. Otherwise very professional and reliable.',
  NOW() - INTERVAL '18 days'
FROM jobs j
JOIN users cu ON cu.id = j.customer_id
JOIN providers p ON p.user_id = (SELECT id FROM users WHERE email = 'grace.wanjiku@demo.co.ke')
WHERE cu.email = 'catherine.njeri@demo.co.ke' AND j.title = 'Weekly office cleaning — small firm';


-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS — Populate welcome messages + recent activity
-- ═══════════════════════════════════════════════════════════════

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id, 'Welcome to LocalServices!',
  'Hello ' || u.full_name || ', your account has been created successfully. Explore verified providers and post your first job.',
  'success', true, u.created_at
FROM users u WHERE u.email LIKE '%@demo.co.ke';

-- Samuel has a new pending assignment (David's kitchen cabinets)
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id, 'New Job Assignment',
  'You have been assigned a new job: "Build custom kitchen cabinets". Please review and respond.',
  'info', false, NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'samuel.odhiambo@demo.co.ke';

-- David got notification that Samuel accepted
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id, 'Job Accepted',
  'Samuel Odhiambo has accepted your job "Build custom kitchen cabinets".',
  'success', false, NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'david.kiprop@demo.co.ke';

-- Ruth (pending provider) received application notification
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id, 'Application Submitted',
  'Your provider application is under review. You will be notified once the admin approves your account.',
  'info', false, NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'ruth.chebet@demo.co.ke';


-- ═══════════════════════════════════════════════════════════════
-- ACTIVITY LOGS — Make it feel populated
-- ═══════════════════════════════════════════════════════════════

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
SELECT u.id, 'USER_REGISTERED', 'user', u.id, u.created_at
FROM users u WHERE u.email LIKE '%@demo.co.ke';


-- ═══════════════════════════════════════════════════════════════
-- DONE — Print summary
-- ═══════════════════════════════════════════════════════════════
SELECT '✅ Demo data loaded!' AS status;
SELECT role, COUNT(*) AS count FROM users WHERE email LIKE '%@demo.co.ke' GROUP BY role;
SELECT verification_status, COUNT(*) FROM providers
  WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke')
  GROUP BY verification_status;
SELECT status, COUNT(*) FROM jobs
  WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%@demo.co.ke')
  GROUP BY status;