/** Auth API calls. The backend sets/clears the httpOnly cookie; these
 * functions only ever read/write the `{ user }` JSON body. */
import { apiClient } from "./client";
import type { User } from "../types";

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/api/auth/register", {
    email,
    password,
    name,
  });
  return data.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/api/auth/login", { email, password });
  return data.user;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/auth/me");
  return data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

export async function updateNotesViewPreference(view: "grid" | "list"): Promise<User> {
  const { data } = await apiClient.patch<User>("/api/auth/me/preferences", { notes_view: view });
  return data;
}
