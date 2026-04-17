/**
 * Reset or create the default admin user (uses backend/.env DB settings).
 *
 *   cd backend
 *   npm run reset-admin
 *
 * Default password: Admin@1234
 * Override: set ADMIN_BOOTSTRAP_PASSWORD in .env first, then run again.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

const ADMIN_EMAIL = 'admin@localservices.co.ke';
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@1234';

async function main() {
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const hash = await bcrypt.hash(ADMIN_PASSWORD.trim(), 12);

  const updated = await query(
    `UPDATE users
     SET password_hash = $1, digital_id = 'KE-00000001', is_active = true
     WHERE LOWER(TRIM(email)) = $2`,
    [hash, email]
  );

  if (updated.rowCount > 0) {
    console.log(`Updated admin (${updated.rowCount} row).`);
  } else {
    await query(
      `INSERT INTO users (full_name, email, password_hash, role, digital_id, phone)
       VALUES ('System Admin', $1, $2, 'admin', 'KE-00000001', '+254700000000')`,
      [email, hash]
    );
    console.log('Created admin user (no matching email was found).');
  }

  console.log('');
  console.log('Sign in with:');
  console.log('  Email:   ', email);
  console.log('  Password:', ADMIN_PASSWORD.trim());
  console.log('');
  await pool.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
