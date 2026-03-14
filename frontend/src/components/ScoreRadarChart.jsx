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
        <PolarGrid stroke="rgba(108, 99, 255, 0.2)" />
        <PolarAngleAxis 
          dataKey="dimension" 
          tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }} 
        />
        <PolarRadiusAxis 
          domain={[0, 10]} 
          tick={{ fill: "#64748B", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6C63FF"
          fill="url(#radarGradient)"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
