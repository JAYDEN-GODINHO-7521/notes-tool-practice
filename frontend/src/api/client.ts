/**
 * REST client. The JWT lives in an httpOnly cookie set by the backend on
 * login/register — the browser stores and attaches it automatically.
 * The frontend never reads or stores the token itself.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends/receives the httpOnly access_token cookie
});

// No request interceptor needed — no header to attach, the cookie goes along
// with every request automatically because of withCredentials above.

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Cookie missing/expired/invalid — nothing to clear client-side.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
