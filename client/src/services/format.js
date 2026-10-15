// Helpers for showing dates and times nicely.
const pad = (n) => String(n).padStart(2, '0');

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const fmtDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// every half-hour from 09:00 to 17:30, skipping the 13:00 lunch break
export const ALL_SLOTS = [];
for (let h = 9; h < 18; h++) {
  if (h === 13) continue;
  ALL_SLOTS.push(`${pad(h)}:00`, `${pad(h)}:30`);
}
