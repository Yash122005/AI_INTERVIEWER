import Session from "../models/Session.model.js";
import Answer from "../models/Answer.model.js";
import Report from "../models/Report.model.js";
import { generateQuestion, evaluateAnswer, generateReport as genAIReport } from "../services/ai.service.js";
import { aggregateScores, getRunningAverage } from "../services/score.service.js";

// Candidate joins session
export const joinSession = async (req, res) => {
  try {
    const { token } = req.params;
    const session = await Session.findOne({ shareableToken: token });
    if (!session) return res.status(404).json({ message: "Invalid interview link" });
    if (session.status === "completed") {
      return res.status(400).json({ message: "This interview has already been completed" });
    }

    // Set candidate info
    session.candidateId = req.user._id;
    session.candidateName = req.user.name;
    session.status = "ongoing";
    await session.save();

    // Generate the first question
    const firstRound = session.rounds[0];
    const { question, type } = await generateQuestion(
      session.jobTitle, session.skills, session.experienceLevel, firstRound, [], 5
    );

    // Emit to recruiter via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`recruiter-${session._id}`).emit("candidateJoined", {
        candidateName: req.user.name,
        sessionId: session._id,
      });
    }

    res.json({
      sessionId: session._id,
      jobTitle: session.jobTitle,
      skills: session.skills,
      experienceLevel: session.experienceLevel,
      rounds: session.rounds,
      questionsPerRound: session.questionsPerRound,
      currentRound: firstRound,
      currentQuestionIndex: 0,
      question,
      questionType: type,
    });
  } catch (error) {
    console.error("Join session error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Candidate submits an answer
export const submitAnswer = async (req, res) => {
  try {
const { sessionId, questionText, answerText, round, questionType, timeTaken } = req.body;
    if (!sessionId || !questionText || !answerText || !round) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "completed") {
      return res.status(400).json({ message: "Interview already completed" });
    }

    // Proctoring: Timing analysis
    if (timeTaken < 2) {
      console.warn(`Suspiciously fast answer from session ${sessionId}: ${timeTaken}s`);
      if (!session.proctoring) {
        session.proctoring = { tabSwitches: 0, copyPasteAttempts: 0, trustScore: 100, isSuspicious: false, logs: [] };
      }
      session.proctoring.trustScore = Math.max(0, session.proctoring.trustScore - 10);
      session.proctoring.logs.push({
        event: `Suspicious: Answered in ${timeTaken}s (Too Fast)`,
        timestamp: new Date(),
      });
      await session.save();
    }

    // Evaluate the answer via AI
    const { scores, evaluation } = await evaluateAnswer(
      questionText, answerText, session.jobTitle, session.skills
    );

    // Save answer
    const answer = await Answer.create({
      sessionId, questionText, round, questionType: questionType || "general",
      answerText, scores, aiEvaluation: evaluation, timeTaken
    });

    // Get all answers so far to determine next step
    const allAnswers = await Answer.find({ sessionId }).sort({ createdAt: 1 });
    const currentRoundAnswers = allAnswers.filter((a) => a.round === round);
    const avgScore = getRunningAverage(allAnswers);

    // Determine if round is complete or interview is done
    const roundIndex = session.rounds.indexOf(round);
    const isRoundComplete = currentRoundAnswers.length >= session.questionsPerRound;
    const isLastRound = roundIndex >= session.rounds.length - 1;
    const isInterviewComplete = isRoundComplete && isLastRound;

    let nextQuestion = null;
    let nextRound = round;
    let nextQuestionIndex = currentRoundAnswers.length;

    if (!isInterviewComplete) {
      if (isRoundComplete) {
        // Move to next round
        nextRound = session.rounds[roundIndex + 1];
        nextQuestionIndex = 0;
      }

      // Build history for context
      const recentHistory = allAnswers.slice(-5).map((a) => ({
        question: a.questionText,
        answer: a.answerText,
      }));

      const generated = await generateQuestion(
        session.jobTitle, session.skills, session.experienceLevel,
        nextRound, recentHistory, avgScore
      );
      nextQuestion = generated.question;
    }

    // Emit real-time update to recruiter
    const io = req.app.get("io");
    if (io) {
      io.to(`recruiter-${sessionId}`).emit("scoreUpdate", {
        sessionId,
        questionText,
        answerText,
        scores,
        evaluation,
        round,
        avgScore,
        totalAnswered: allAnswers.length,
      });
    }

    res.json({
      answer: { _id: answer._id, scores, aiEvaluation: evaluation },
      nextQuestion,
      nextRound,
      nextQuestionIndex,
      isInterviewComplete,
      avgScore,
    });
  } catch (error) {
    console.error("Submit answer error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Complete the interview and generate report
export const completeInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const allAnswers = await Answer.find({ sessionId }).sort({ createdAt: 1 });
    if (allAnswers.length === 0) {
      return res.status(400).json({ message: "No answers found for this session" });
    }

    // Aggregate scores
    const { overallScore, roundScores, dimensionScores } = aggregateScores(allAnswers, session.rounds);

    // Generate AI report
    const { aiSummary, recommendation } = await genAIReport(session, allAnswers);

    // Save report
    const report = await Report.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        candidateId: session.candidateId,
        candidateName: session.candidateName || "Candidate",
        jobTitle: session.jobTitle,
        overallScore,
        roundScores,
        dimensionScores,
        aiSummary,
        recommendation,
      },
      { upsert: true, new: true }
    );

    // Update session status
    session.status = "completed";
    await session.save();

    // Notify recruiter
    const io = req.app.get("io");
    if (io) {
      io.to(`recruiter-${sessionId}`).emit("interviewCompleted", {
        sessionId,
        overallScore,
        recommendation,
      });
    }

    res.json({ report, answers: allAnswers });
  } catch (error) {
    console.error("Complete interview error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
