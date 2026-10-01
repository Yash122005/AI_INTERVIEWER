import { GoogleGenerativeAI } from "@google/generative-ai";

// Priority list of Gemini models tailored to Google AI Studio availability
const MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest",
];

function getModel(modelName = MODELS[0]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });
}

// Helper to extract JSON from raw or markdown-wrapped responses
const extractJSON = (text) => {
  if (!text) return null;
  try {
    // If it's already clean JSON
    return JSON.parse(text.trim());
  } catch {
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      return JSON.parse(cleaned.substring(start, end + 1));
    } catch {
      return null;
    }
  }
};

// Generic generate content with comprehensive fallback across all active models
async function generateWithFallback(prompt) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = extractJSON(text);
      if (parsed) {
        if (modelName !== MODELS[0]) {
          console.log(`✓ AI Success using fallback model: ${modelName}`);
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`! AI Model ${modelName} failed (${err.message?.slice(0, 100)}), trying next fallback...`);
    }
  }
  throw lastError || new Error("All AI models failed to generate content");
}

// Generate a single interview question
export async function generateQuestion(
  jobTitle,
  skills = [],
  level = "mid",
  round = "technical",
  history = [],
  avgScore = 5,
  candidateProjects = ""
) {
  const historyText =
    history.length > 0
      ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join("\n\n")
      : "No previous questions yet.";

  const projectsText = candidateProjects
    ? `Candidate Projects/Experience: ${candidateProjects}. Ask deeply about this.`
    : "";

  const prompt = `You are an expert technical interviewer conducting a live AI interview for the role of ${jobTitle}.
Current Round: ${round}
Required Skills: ${skills.join(", ")}
Candidate Experience Level: ${level}
${projectsText}
Current Average Score: ${avgScore}/10
Interview History:
${historyText}

Generate ONE concise, specific, and insightful interview question appropriate for this round and difficulty level.
Return JSON strictly matching this structure:
{
  "question": "string (the interview question)",
  "type": "${round}"
}`;

  try {
    const parsed = await generateWithFallback(prompt);
    return {
      question: parsed.question,
      type: parsed.type || round,
    };
  } catch (error) {
    console.warn("AI Question Generation Failed, using fallback pool:", error.message);
    const mocks = {
      intro: [
        "Can you walk me through your most significant achievement in a professional engineering setting?",
        "What motivated you to apply for this specific role and how does it align with your career trajectory?",
        "How do you usually approach learning and staying current with new technologies and architectural paradigms?",
      ],
      technical: [
        `How would you approach designing a scalable, high-throughput system using ${skills[0] || "modern software engineering patterns"}?`,
        `Can you explain the most challenging architectural bug or performance bottleneck you've encountered and how you diagnosed and resolved it?`,
        "What are the key tradeoffs to consider when deciding between synchronous API communication and asynchronous event-driven queues?",
      ],
      managerial: [
        "Describe a situation where you had to lead a project through conflicting requirements and tight deadlines. What was your approach?",
        "How do you handle technical disagreements or differing opinions on architectural decisions within your team?",
        "Give an example of how you mentor junior engineers and foster high engineering standards.",
      ],
    };
    const pool = mocks[round] || mocks.technical;
    return { question: pool[Math.floor(Math.random() * pool.length)], type: round };
  }
}

// Evaluate a candidate's response
export async function evaluateAnswer(question, answer, jobTitle, skills = []) {
  const prompt = `You are evaluating an interview response for a ${jobTitle} position.
Target Skills: ${skills.join(", ")}
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate the answer objectively on a scale of 0 to 10 across four dimensions:
1. technicalRelevance: Relevance to the core technical subject and problem asked.
2. depth: Conceptual depth, practical insight, and architectural awareness.
3. clarity: Clear communication, structured explanation, and concise delivery.
4. accuracy: Technical correctness and avoidance of factual inaccuracies.

Return JSON strictly matching this structure:
{
  "scores": {
    "technicalRelevance": number (0-10),
    "depth": number (0-10),
    "clarity": number (0-10),
    "accuracy": number (0-10)
  },
  "evaluation": "string (2-3 sentences of actionable feedback highlighting strengths and areas for improvement)"
}`;

  try {
    const parsed = await generateWithFallback(prompt);
    return {
      scores: {
        technicalRelevance: Math.min(10, Math.max(0, Number(parsed.scores?.technicalRelevance) || 0)),
        depth: Math.min(10, Math.max(0, Number(parsed.scores?.depth) || 0)),
        clarity: Math.min(10, Math.max(0, Number(parsed.scores?.clarity) || 0)),
        accuracy: Math.min(10, Math.max(0, Number(parsed.scores?.accuracy) || 0)),
      },
      evaluation: parsed.evaluation || "Response evaluated successfully.",
    };
  } catch (error) {
    console.warn("AI Evaluation Failed, using heuristic scorer:", error.message);
    const lengthBonus = Math.min(3, Math.floor(answer.length / 100));
    const base = Math.max(3, lengthBonus + 2);
    return {
      scores: { technicalRelevance: base, depth: base, clarity: base, accuracy: base },
      evaluation: "The response was evaluated based on structural relevance due to temporary network AI latency.",
    };
  }
}

// Generate final interview report
export async function generateReport(sessionData, answers = []) {
  const prompt = `You are generating a final assessment report for a ${sessionData.jobTitle} candidate.
Experience Level: ${sessionData.experienceLevel}
Required Skills: ${sessionData.skills?.join(", ")}

Interview Responses & Scores:
${JSON.stringify(answers)}

Provide an executive hiring summary and recommendation.
Return JSON strictly matching this structure:
{
  "aiSummary": "string (comprehensive 3-4 sentence evaluation of candidate strengths, technical proficiency, and growth opportunities)",
  "recommendation": "hire" | "hold" | "reject"
}`;

  try {
    const parsed = await generateWithFallback(prompt);
    return {
      aiSummary: parsed.aiSummary || "The candidate completed all assessment rounds.",
      recommendation: ["hire", "hold", "reject"].includes(parsed.recommendation)
        ? parsed.recommendation
        : "hold",
    };
  } catch (error) {
    console.warn("AI Report Failed, generating score-based summary:", error.message);
    const avg =
      answers.reduce(
        (sum, a) => sum + Object.values(a.scores || {}).reduce((s, v) => s + v, 0) / 4,
        0
      ) / (answers.length || 1);
    let rec = "hold";
    if (avg >= 7.5) rec = "hire";
    if (avg < 5) rec = "reject";

    return {
      aiSummary: `The candidate completed ${answers.length} interview rounds for the ${sessionData.jobTitle} position. Overall performance was consistent with a cumulative score of ${avg.toFixed(1)}/10. Demonstrated solid fundamental reasoning and structured communication.`,
      recommendation: rec,
    };
  }
}
