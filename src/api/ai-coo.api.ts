import { api } from "./base.api";
import type { AiCooDocument, AiCooState } from "@/types/ai-coo.types";

const path = (workspaceId: string) =>
  `/workspace/${encodeURIComponent(workspaceId)}/ai-coo`;
const params = (departmentId: string) => (departmentId ? { departmentId } : {});

export const aiCooApi = {
  get: (workspaceId: string, departmentId: string, signal?: AbortSignal) =>
    api
      .get<AiCooState>(path(workspaceId), {
        params: params(departmentId),
        signal,
      })
      .then((r) => r.data),
  send: (
    workspaceId: string,
    departmentId: string,
    text: string,
    requestId: string,
    signal?: AbortSignal,
  ) =>
    api
      .post<AiCooState>(
        `${path(workspaceId)}/messages`,
        { ...params(departmentId), text, requestId },
        { signal, timeout: 330_000 },
      )
      .then((r) => r.data),
  upload: (
    workspaceId: string,
    departmentId: string,
    file: File,
    signal?: AbortSignal,
  ) => {
    const data = new FormData();
    data.append("file", file);
    return api
      .post<AiCooDocument>(`${path(workspaceId)}/documents`, data, {
        params: params(departmentId),
        signal,
        timeout: 330_000,
      })
      .then((r) => r.data);
  },
  remove: (
    workspaceId: string,
    departmentId: string,
    documentId: string,
    signal?: AbortSignal,
  ) =>
    api
      .delete<{ deleted: true }>(
        `${path(workspaceId)}/documents/${encodeURIComponent(documentId)}`,
        { params: params(departmentId), signal, timeout: 330_000 },
      )
      .then((r) => r.data),
};
