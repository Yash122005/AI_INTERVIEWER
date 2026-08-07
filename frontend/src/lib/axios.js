import axios from "axios";

const apiBaseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5001/api");

const api = axios.create({
  baseURL: apiBaseURL,
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
