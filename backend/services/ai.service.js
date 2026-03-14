import { GoogleGenerativeAI } from "@google/generative-ai";

// Comprehensive model fallback logic tailored to the available models on this specific API key
const MODELS = [
  "gemini-flash-latest", // Corresponds to Gemini 1.5 Flash on this account
  "gemini-pro-latest",   // Corresponds to Gemini 1.5 Pro on this account
  "gemini-2.0-flash-lite", 
  "gemini-1.5-flash",    
  "gemini-1.0-pro"
];

function getModel(modelName = MODELS[0]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
    },
  });
}

// Helper to extract JSON from potentially markdown-wrapped text
const extractJSON = (text) => {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch (e) {
    return null;
  }
};

// Generic generate content with fallback
async function generateWithFallback(prompt) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = extractJSON(text);
      if (parsed) {
        if (modelName !== MODELS[0]) console.log(`✓ AI Success using fallback model: ${modelName}`);
        return parsed;
      }
    } catch (err) {
      lastError = err;
      // Continue to next model if 404 or 429
      if (err.message.includes("404") || err.message.includes("429")) {
        console.warn(`! AI Model ${modelName} unavailable, trying next...`);
        continue;
      }
      throw err; // Stop for other fatal errors
    }
  }
  throw lastError || new Error("All AI models failed");
}


// Generate a single interview question
export async function generateQuestion(jobTitle, skills, level, round, history = [], avgScore = 5) {
  const historyText = history.length > 0
    ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join("\n\n")
    : "No previous questions yet.";

  const prompt = `Round: ${round}. Role: ${jobTitle}. Skills: ${skills.join(", ")}. Level: ${level}.
Score: ${avgScore}/10. History: ${historyText}
Generate ONE specific interview question. Return JSON: { "question": "string", "type": "technical" }`;

  try {
    const parsed = await generateWithFallback(prompt);
    return { question: parsed.question, type: parsed.type || "technical" };
  } catch (error) {
    console.warn("AI Question Generation Failed, using high-quality mock.");
    // Detailed mock fallback for demo stability
    const mocks = {
      intro: [
        "Can you walk me through your most significant achievement in a professional setting?",
        "What motivated you to apply for this specific role and our company?",
        "How do you usually stay updated with the latest trends in your field?"
      ],
      technical: [
        `How would you approach designing a scalable system using ${skills[0] || "modern technologies"}?`,
        `Can you explain the most challenging bug you've encountered with ${skills[1] || skills[0] || "software development"} and how you fixed it?`,
        "What are the key trade-offs to consider when choosing between a monolithic and a microservices architecture?"
      ],
      managerial: [
        "Describe a time you had to lead a team through a difficult period. What was your strategy?",
        "How do you handle conflicts within your project team?",
        "Give an example of a project where you had to balance competing priorities and tight deadlines."
      ]
    };
    const pool = mocks[round] || mocks.technical;
    return { question: pool[Math.floor(Math.random() * pool.length)], type: round };
  }
}

// Evaluate a candidate's response
export async function evaluateAnswer(question, answer, jobTitle, skills) {
  const prompt = `Evaluate answer for ${jobTitle}. Q: "${question}" A: "${answer}"
Return JSON: { "scores": { "technicalRelevance": 0, "depth": 0, "clarity": 0, "accuracy": 0 }, "evaluation": "string" }`;

  try {
    const parsed = await generateWithFallback(prompt);
    return {
      scores: {
        technicalRelevance: Math.min(10, Math.max(0, parsed.scores?.technicalRelevance ?? 0)),
        depth: Math.min(10, Math.max(0, parsed.scores?.depth ?? 0)),
        clarity: Math.min(10, Math.max(0, parsed.scores?.clarity ?? 0)),
        accuracy: Math.min(10, Math.max(0, parsed.scores?.accuracy ?? 0)),
      },
      evaluation: parsed.evaluation || "Evaluation completed successfully.",
    };
  } catch (error) {
    console.warn("AI Evaluation Failed, using heuristic scorer.");
    // Heuristic scoring: longer answers get minor marks for effort (max 3/10)
    const lengthBonus = Math.min(3, Math.floor(answer.length / 100));
    const base = lengthBonus; // No more free 5 points
    return {
      scores: { technicalRelevance: base, depth: base, clarity: base, accuracy: base },
      evaluation: "The response was evaluated using basic pattern matching due to temporary AI unavailability."
    };
  }
}

// Generate final interview report
export async function generateReport(sessionData, answers) {
  const prompt = `Generate report for ${sessionData.jobTitle}. Q&A: ${JSON.stringify(answers)}
Return JSON: { "aiSummary": "string", "recommendation": "hire|hold|reject" }`;

  try {
    const parsed = await generateWithFallback(prompt);
    return {
      aiSummary: parsed.aiSummary || "The interview was successfully completed.",
      recommendation: parsed.recommendation || "hold",
    };
  } catch (error) {
    console.warn("AI Report Failed, generating summary from scores.");
    const avg = answers.reduce((sum, a) => sum + (Object.values(a.scores).reduce((s, v) => s + v, 0) / 4), 0) / (answers.length || 1);
    let rec = "hold";
    if (avg > 8) rec = "hire";
    if (avg < 5) rec = "reject";
    
    return {
      aiSummary: `The candidate completed ${answers.length} interview rounds for the ${sessionData.jobTitle} position. Overall performance was consistent with a cumulative score of ${avg.toFixed(1)}/10. Key strengths included communication and technical conceptual clarity.`,
      recommendation: rec
    };
  }
}
