import { useCallback, useEffect, useRef, useState } from "react";
import { aiCooApi } from "@/api/ai-coo.api";
import { ApiError, errorMessage } from "@/api/base.api";
import type { AiCooMessage, AiCooState } from "@/types/ai-coo.types";

export const COO_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX"];
export const COO_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const COO_MAX_DOCUMENTS = 5;
export const COO_MAX_MESSAGE_LENGTH = 8000;

export function useAiCoo(workspaceId: string, departmentId: string) {
  const [data, setData] = useState<AiCooState | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState<AiCooMessage | null>(
    null,
  );
  const controllers = useRef(new Set<AbortController>());
  const active = useRef(true);
  const working = useRef(false);
  const revision = useRef(0);
  const loadSequence = useRef(0);

  const controller = useCallback(() => {
    const c = new AbortController();
    controllers.current.add(c);
    return c;
  }, []);
  const current = (c: AbortController) => active.current && !c.signal.aborted;

  const load = useCallback(
    async (silent = false) => {
      const c = controller();
      const sequence = ++loadSequence.current;
      const version = revision.current;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const result = await aiCooApi.get(workspaceId, departmentId, c.signal);
        if (
          current(c) &&
          sequence === loadSequence.current &&
          version === revision.current
        )
          setData(result);
        return current(c) ? result : null;
      } catch (e) {
        if (
          current(c) &&
          sequence === loadSequence.current &&
          version === revision.current
        ) {
          if (e instanceof ApiError && [401, 402, 403, 404].includes(e.status))
            setData(null);
          setError(errorMessage(e));
        }
        return null;
      } finally {
        controllers.current.delete(c);
        if (current(c) && sequence === loadSequence.current) setLoading(false);
      }
    },
    [controller, workspaceId, departmentId],
  );

  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
      for (const c of controllers.current) c.abort();
      controllers.current.clear();
    };
  }, [load]);

  const hasPending = Boolean(
    data?.messages.some((m) => m.status === "pending"),
  );
  useEffect(() => {
    if (!hasPending || operation) return;
    let cancelled = false;
    let timer = window.setTimeout(poll, 5000);
    async function poll() {
      await load(true);
      if (!cancelled) timer = window.setTimeout(poll, 5000);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasPending, operation, load]);

  async function send(text: string, requestId: string) {
    if (working.current || !data) return false;
    working.current = true;
    revision.current++;
    const c = controller();
    setError("");
    setOperation("Анализирую данные…");
    setPendingMessage({
      id: `sending:${requestId}`,
      requestId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      documents: data.documents,
      status: "pending",
    });
    try {
      const result = await aiCooApi.send(
        workspaceId,
        departmentId,
        text,
        requestId,
        c.signal,
      );
      if (!current(c)) return false;
      setData(result);
      return true;
    } catch (e) {
      if (!current(c)) return false;
      setError(errorMessage(e));
      // The response may have been lost after the server committed the turn.
      const result = await load(true);
      if (!current(c)) return false;
      const completed = result?.messages.some(
        (m) => m.requestId === requestId && m.status === "complete",
      );
      if (completed) setError("");
      return Boolean(completed);
    } finally {
      controllers.current.delete(c);
      if (current(c)) {
        setOperation(null);
        setPendingMessage(null);
      }
      working.current = false;
    }
  }

  async function upload(files: File[]) {
    if (working.current || !data || !files.length) return;
    const invalid = files.find(
      (file) =>
        !COO_FORMATS.includes(
          file.name.split(".").pop()?.toUpperCase() ?? "",
        ) ||
        !file.size ||
        file.size > COO_MAX_FILE_SIZE,
    );
    if (invalid) {
      setError(
        `«${invalid.name}»: допустимы PDF, DOCX, XLSX и PPTX размером от 1 байта до 10 МБ.`,
      );
      return;
    }
    if (data.documents.length + files.length > COO_MAX_DOCUMENTS) {
      setError(
        "В одном диалоге можно использовать до 5 документов. Удалите ненужные файлы.",
      );
      return;
    }
    working.current = true;
    revision.current++;
    const c = controller();
    setError("");
    try {
      for (const [index, file] of files.entries()) {
        if (!current(c)) break;
        setOperation(
          `Загружаю документ ${index + 1} из ${files.length}: ${file.name}`,
        );
        const document = await aiCooApi.upload(
          workspaceId,
          departmentId,
          file,
          c.signal,
        );
        if (current(c))
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  documents: [
                    ...prev.documents.filter((d) => d.id !== document.id),
                    document,
                  ],
                }
              : prev,
          );
      }
    } catch (e) {
      if (current(c)) {
        setError(errorMessage(e));
        await load(true);
      }
    } finally {
      controllers.current.delete(c);
      if (current(c)) setOperation(null);
      working.current = false;
    }
  }

  async function remove(documentId: string) {
    if (working.current || !data) return;
    working.current = true;
    revision.current++;
    const c = controller();
    setError("");
    setOperation("Удаляю документ…");
    try {
      await aiCooApi.remove(workspaceId, departmentId, documentId, c.signal);
      if (current(c))
        setData((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((d) => d.id !== documentId),
              }
            : prev,
        );
    } catch (e) {
      if (current(c)) {
        setError(errorMessage(e));
        await load(true);
      }
    } finally {
      controllers.current.delete(c);
      if (current(c)) setOperation(null);
      working.current = false;
    }
  }

  return {
    data,
    loading,
    error,
    operation,
    pendingMessage,
    hasPending,
    busy: Boolean(operation) || hasPending,
    load,
    send,
    upload,
    remove,
  };
}
