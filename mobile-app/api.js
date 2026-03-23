import axios from "axios";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // Required for ngrok free-tier API calls
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
