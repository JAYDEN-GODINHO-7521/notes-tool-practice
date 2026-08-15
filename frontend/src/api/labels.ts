import { apiClient } from "./client";
import type { Label } from "../types";

export async function listLabels(): Promise<Label[]> {
  const { data } = await apiClient.get<Label[]>("/api/labels");
  return data;
}

export async function createLabel(name: string, color = "default"): Promise<Label> {
  const { data } = await apiClient.post<Label>("/api/labels", { name, color });
  return data;
}

export async function updateLabel(id: string, input: { name?: string; color?: string }): Promise<Label> {
  const { data } = await apiClient.patch<Label>(`/api/labels/${id}`, input);
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  await apiClient.delete(`/api/labels/${id}`);
}
