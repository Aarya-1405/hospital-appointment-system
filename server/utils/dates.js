// Small date helpers. Dates are stored as "YYYY-MM-DD" text and times as "HH:MM" text,
// which keeps comparisons simple for beginners ("2026-10-12" < "2026-10-13" works as text).
const pad = (n) => String(n).padStart(2, '0');

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const isRealDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d; // rejects 2026-02-31
};
const weekdayOf = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });

// Throw an error with an HTTP status; server.js turns it into a JSON response.
const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};

module.exports = { todayStr, nowTime, isRealDate, weekdayOf, fail };
