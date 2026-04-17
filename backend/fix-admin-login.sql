-- Run after importing schema.sql if admin login fails.
-- Password for admin@localservices.co.ke: Admin@1234
-- psql -U postgres -d localservices -f fix-admin-login.sql
--
-- Or from the backend folder: npm run reset-admin
-- (re-hashes the password so it always matches bcryptjs)

UPDATE users
SET
  password_hash = '$2a$12$Aauv9EXXxYwLaf6ueYLKyemI8NmXS1TqkJiSVUH5f57iS7Bl7kVBW',
  digital_id = 'KE-00000001'
WHERE email = 'admin@localservices.co.ke';
