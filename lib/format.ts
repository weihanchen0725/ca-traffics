export const fmtAgo = (iso?: string | null) => {
  if (!iso) return "n/a";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms/60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  return `${h}h ago`;
};
