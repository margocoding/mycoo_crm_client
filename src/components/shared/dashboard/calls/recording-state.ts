import type { LiveMeeting } from "@/types/meetings.types";

export function recordingState(recordings: LiveMeeting["recordings"]) {
  const pending = recordings.find((r) =>
    ["starting", "recording", "stopping"].includes(r.status),
  );
  const latest = pending || recordings[recordings.length - 1];
  const error =
    latest?.error ||
    (latest?.status === "failed" ? "Не удалось обработать запись." : "");
  const capturing = latest?.status === "recording" && !error;
  const labels: Record<string, string> = {
    starting: "Запись запускается",
    recording: "Идёт запись",
    stopping: "Сохраняем запись",
    transcribing: "Запись сохранена · распознаём речь",
    ready: "Запись сохранена",
  };
  return {
    pending: !!pending,
    stopping: pending?.status === "stopping",
    capturing,
    error,
    label: error
      ? "Ошибка записи"
      : labels[latest?.status || ""] || "Запись выключена",
    description: error
      ? "Статус записи не подтверждён. Проверьте сообщение об ошибке."
      : capturing
        ? "Аудио записывается для подготовки протокола"
        : labels[latest?.status || ""] || "Запись выключена",
  };
}
