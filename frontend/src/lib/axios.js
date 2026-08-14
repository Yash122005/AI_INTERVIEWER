import axios from "axios";

const getApiBaseURL = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocalhost ? "http://localhost:5001/api" : "/api";
  }

  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseURL(),
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("interviewiq_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("interviewiq_token");
      localStorage.removeItem("interviewiq_user");
    }
    return Promise.reject(error);
  }
);

export default api;
