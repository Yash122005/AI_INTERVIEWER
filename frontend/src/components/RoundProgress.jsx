const roundLabels = {
  intro: "Introductory",
  technical: "Technical",
  managerial: "Managerial",
};

export default function RoundProgress({ rounds, currentRound }) {
  const currentIdx = rounds.indexOf(currentRound);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {rounds.map((round, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;

        return (
          <div key={round} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                borderRadius: "var(--radius)",
                backgroundColor: isActive
                  ? "var(--accent)"
                  : isCompleted
                  ? "var(--success-soft)"
                  : "var(--background)",
                border: isActive
                  ? "1px solid var(--accent)"
                  : isCompleted
                  ? "1px solid rgba(52, 211, 153, 0.3)"
                  : "1px solid var(--border)",
                transition: "var(--transition)",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: isActive
                    ? "#0C1519"
                    : isCompleted
                    ? "var(--success)"
                    : "rgba(215, 184, 153, 0.2)",
                  color: isActive ? "var(--accent)" : isCompleted ? "#0C1519" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? "#0C1519"
                    : isCompleted
                    ? "var(--success)"
                    : "var(--text-secondary)",
                }}
              >
                {roundLabels[round] || round}
              </span>
            </div>
            {idx < rounds.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  backgroundColor: isCompleted ? "var(--success)" : "var(--border)",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
