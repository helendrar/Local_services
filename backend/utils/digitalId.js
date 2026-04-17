/** Digital ID: KE-12345678 or ET-12345678 (8 digits after hyphen). */
const DIGITAL_ID_RE = /^(KE|ET)-\d{8}$/;

function normalizeDigitalId(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  return raw.trim().toUpperCase();
}

function isValidDigitalId(raw) {
  return DIGITAL_ID_RE.test(normalizeDigitalId(raw));
}

module.exports = { normalizeDigitalId, isValidDigitalId };
