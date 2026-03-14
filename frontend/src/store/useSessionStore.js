import { create } from "zustand";

const useSessionStore = create((set) => ({
  sessionId: null,
  jobTitle: "",
  skills: [],
  experienceLevel: "",
  rounds: [],
  questionsPerRound: 3,
  currentRound: "",
  currentQuestionIndex: 0,
  currentQuestion: "",
  questionType: "",
  answers: [],
  scores: [],
  isComplete: false,
  avgScore: 5,

  setSessionData: (data) => set(data),

  setCurrentQuestion: (question, type) =>
    set({ currentQuestion: question, questionType: type || "general" }),

  addAnswer: (answer) =>
    set((state) => ({ answers: [...state.answers, answer] })),

  addScore: (score) =>
    set((state) => ({ scores: [...state.scores, score] })),

  advanceQuestion: (nextQuestion, nextRound, nextIndex) =>
    set({
      currentQuestion: nextQuestion,
      currentRound: nextRound,
      currentQuestionIndex: nextIndex,
    }),

  completeInterview: () => set({ isComplete: true }),

  resetSession: () =>
    set({
      sessionId: null, jobTitle: "", skills: [], experienceLevel: "",
      rounds: [], currentRound: "", currentQuestionIndex: 0,
      currentQuestion: "", questionType: "", answers: [], scores: [],
      isComplete: false, avgScore: 5,
    }),
}));

export default useSessionStore;
