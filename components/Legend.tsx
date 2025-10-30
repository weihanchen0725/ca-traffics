export function Legend() {
  return (
    <div className="legend">
      <strong>Legend</strong> &nbsp;
      <span className="badge">Incident</span>
      <span className="badge" style={{ background:"#ffd2d2" }}>Closure</span>
      <span className="badge" style={{ background:"#e0d4ff" }}>Chain</span>
      <span className="badge" style={{ background:"#e6ffe0" }}>Restriction</span>
    </div>
  );
}
