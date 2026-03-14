const roundLabels = {
  intro: "Introduction",
  technical: "Technical",
  managerial: "Managerial",
};

export default function RoundProgress({ rounds, currentRound }) {
  const currentIdx = rounds.indexOf(currentRound);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
    }}>
      {rounds.map((round, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;

        return (
          <div key={round} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 16px", borderRadius: "20px",
              background: isActive
                ? "var(--accent-gradient)"
                : isCompleted
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(100, 116, 139, 0.1)",
              border: isActive
                ? "none"
                : isCompleted
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : "1px solid var(--border-color)",
              transition: "all 0.3s ease",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: isActive ? "#fff" : isCompleted ? "var(--success)" : "var(--text-muted)",
                color: isActive ? "var(--accent-primary)" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
              }}>
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#fff" : isCompleted ? "var(--success)" : "var(--text-secondary)",
              }}>
                {roundLabels[round] || round}
              </span>
            </div>
            {idx < rounds.length - 1 && (
              <div style={{
                width: 24, height: 2,
                background: isCompleted ? "var(--success)" : "var(--border-color)",
                borderRadius: 1,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
