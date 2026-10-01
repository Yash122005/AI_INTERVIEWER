import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function ScoreRadarChart({ scores, size = 300 }) {
  const data = [
    { dimension: "Relevance", score: scores?.technicalRelevance || 0, fullMark: 10 },
    { dimension: "Depth", score: scores?.depth || 0, fullMark: 10 },
    { dimension: "Clarity", score: scores?.clarity || 0, fullMark: 10 },
    { dimension: "Accuracy", score: scores?.accuracy || 0, fullMark: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data} cx="50%" cy="50%">
        <PolarGrid stroke="rgba(166, 124, 82, 0.2)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#D7B899", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
        />
        <PolarRadiusAxis
          domain={[0, 10]}
          tick={{ fill: "rgba(215, 184, 153, 0.4)", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#A67C52"
          fill="url(#radarBronzeGradient)"
          fillOpacity={0.45}
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="radarBronzeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A67C52" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#724B39" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
