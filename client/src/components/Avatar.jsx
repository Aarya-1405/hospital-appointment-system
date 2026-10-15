// Draws a round avatar with the doctor's initials (no image files needed).
const tints = [
  ['#dff0fb', '#2a6fa8'], ['#d9f4f1', '#0b7d75'], ['#e6ecfb', '#3d57a8'],
  ['#dcf3ea', '#1d7a56'], ['#e3f1f8', '#25728f'],
];

export default function Avatar({ name, size = 64 }) {
  const initials = name.replace(/^Dr\.?\s*/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
  const [bg, fg] = tints[name.length % tints.length];
  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size / 2.6 }}>
      {initials}
    </div>
  );
}
