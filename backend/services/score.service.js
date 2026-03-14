// Aggregate scores from answers into structured report data
export function aggregateScores(answers, rounds) {
  const dimensions = ["technicalRelevance", "depth", "clarity", "accuracy"];

  // Per-round average scores
  const roundScores = {};
  for (const round of rounds) {
    const roundAnswers = answers.filter((a) => a.round === round);
    if (roundAnswers.length === 0) {
      roundScores[round] = 0;
      continue;
    }
    const avg = roundAnswers.reduce((sum, a) => {
      const ansAvg = dimensions.reduce((s, d) => s + (a.scores[d] || 0), 0) / dimensions.length;
      return sum + ansAvg;
    }, 0) / roundAnswers.length;
    roundScores[round] = Math.round(avg * 10) / 10;
  }

  // Per-dimension average scores
  const dimensionScores = {};
  for (const dim of dimensions) {
    const total = answers.reduce((sum, a) => sum + (a.scores[dim] || 0), 0);
    dimensionScores[dim] = answers.length > 0 ? Math.round((total / answers.length) * 10) / 10 : 0;
  }

  // Overall score (0-100)
  const dimValues = Object.values(dimensionScores);
  const overallScore = dimValues.length > 0
    ? Math.round((dimValues.reduce((s, v) => s + v, 0) / dimValues.length) * 10)
    : 0;

  return { overallScore, roundScores, dimensionScores };
}

// Calculate running average score from answers so far
export function getRunningAverage(answers) {
  if (answers.length === 0) return 5;
  const dimensions = ["technicalRelevance", "depth", "clarity", "accuracy"];
  const total = answers.reduce((sum, a) => {
    return sum + dimensions.reduce((s, d) => s + (a.scores[d] || 0), 0) / dimensions.length;
  }, 0);
  return Math.round((total / answers.length) * 10) / 10;
}
