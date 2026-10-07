import { useState } from "react";
import { Link } from "react-router-dom";
import { meetingsApi } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import type { LiveMeeting, ProtocolTask } from "@/types/meetings.types";

const statuses: Record<string, string> = {
  starting: "Запускаем запись",
  recording: "Идёт запись",
  stopping: "Сохраняем запись",
  transcribing: "Распознаём речь",
  ready: "Расшифровка готова",
  failed: "Ошибка обработки",
};
export default function MeetingProtocol({
  workspaceId,
  meeting: m,
  onUpdate,
}: {
  workspaceId: string;
  meeting: LiveMeeting;
  onUpdate: (m: LiveMeeting) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  async function analyze() {
    setBusy(true);
    setError("");
    try {
      onUpdate(
        await meetingsApi.transcript(
          workspaceId,
          m.id,
          text ?? m.transcript ?? "",
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="meeting-panel p-6">
      <h2 className="meeting-section-heading">Запись и протокол</h2>
      {error && (
        <p role="alert" className="mt-3 text-crit">
          {error}
        </p>
      )}
      {m.recordings.length ? (
        <div className="mt-4 space-y-2">
          {m.recordings.map((r, i) => (
            <div key={r.id} className="rounded border border-line p-3 text-sm">
              <span>
                Запись {i + 1} · {statuses[r.status] || r.status}
              </span>
              {r.error && <p className="mt-2 text-warn">{r.error}</p>}
              {r.downloadable && (
                <button
                  className="meeting-button mt-2"
                  onClick={async () => {
                    const popup = window.open("about:blank", "_blank");
                    if (popup) popup.opener = null;
                    try {
                      const { url } = await meetingsApi.recording(
                        workspaceId,
                        m.id,
                        r.id,
                      );
                      if (popup) popup.location.href = url;
                      else
                        setError(
                          "Разрешите открытие новой вкладки для просмотра записи.",
                        );
                    } catch (e) {
                      popup?.close();
                      setError(errorMessage(e));
                    }
                  }}
                >
                  Открыть запись
                </button>
              )}
              {r.status === "failed" && m.canModerate && !m.publishedAt && (
                <button
                  disabled={busy}
                  className="meeting-button mt-2"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      onUpdate(
                        await meetingsApi.retryRecording(
                          workspaceId,
                          m.id,
                          r.id,
                        ),
                      );
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Повторить обработку
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-fog">
          Запись можно включить во время звонка.
        </p>
      )}
      <div className="mt-5">
        <label className="meeting-field">
          Заметки встречи
          <textarea
            readOnly={!m.canModerate}
            maxLength={10000}
            rows={3}
            value={notes ?? m.notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {m.canModerate && notes !== null && (
          <button
            disabled={busy}
            className="meeting-button mt-2"
            onClick={async () => {
              setBusy(true);
              try {
                onUpdate(await meetingsApi.notes(workspaceId, m.id, notes));
                setNotes(null);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Сохранить заметки
          </button>
        )}
      </div>
      {m.status === "completed" && m.canReview && !m.publishedAt && (
        <div className="mt-6 space-y-3">
          <label className="meeting-field">
            Расшифровка
            <textarea
              rows={6}
              maxLength={250000}
              value={text ?? m.transcript ?? ""}
              onChange={(e) => setText(e.target.value)}
              placeholder="После обработки записи текст появится здесь. Также можно вставить готовую расшифровку."
            />
          </label>
          <button
            disabled={
              busy ||
              !(text ?? m.transcript ?? "").trim() ||
              ["queued", "processing"].includes(m.analysisStatus)
            }
            className="meeting-button primary"
            onClick={() => void analyze()}
          >
            {busy ? "Сохраняем…" : "Составить AI-протокол"}
          </button>
        </div>
      )}
      {["queued", "processing"].includes(m.analysisStatus) && (
        <p role="status" className="mt-4 text-flux">
          Составляем протокол. Можно закрыть страницу — обработка продолжится.
        </p>
      )}
      {m.analysisError && <p className="mt-4 text-warn">{m.analysisError}</p>}
      {m.analysis && (
        <>
          <div className="mt-6 space-y-3 text-sm leading-7 text-mist">
            <h3 className="font-semibold text-snow">Краткое резюме</h3>
            <p className="whitespace-pre-wrap">{m.analysis.ownerSummary}</p>
            <p className="whitespace-pre-wrap">{m.analysis.summary}</p>
            {m.analysis.risks.length > 0 && (
              <div>
                <h4 className="text-warn">Риски</h4>
                <ul className="list-inside list-disc">
                  {m.analysis.risks.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            {m.analysis.openQuestions.length > 0 && (
              <div>
                <h4 className="text-flux">Открытые вопросы</h4>
                <ul className="list-inside list-disc">
                  {m.analysis.openQuestions.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {m.canReview && !m.publishedAt && m.analysisStatus === "draft" ? (
            <Editor
              key={m.id + ":" + m.analysisRevision}
              workspaceId={workspaceId}
              meeting={m}
              onUpdate={onUpdate}
            />
          ) : (
            m.publishedAt && (
              <>
                <p className="mt-4 text-ok">
                  Протокол подтверждён руководителем.
                </p>
                <ul className="mt-3 list-inside list-disc text-sm text-mist">
                  {m.analysis.decisions.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </>
            )
          )}
        </>
      )}
      {m.tasks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-snow">
            Задачи по встрече · {m.tasks.length}
          </h3>
          <p className="mt-2 text-sm text-fog">
            Выполнено: {m.tasks.filter((t) => t.status === "done").length} ·
            Открыто: {m.tasks.filter((t) => t.status !== "done").length} ·
            Просрочено:{" "}
            {
              m.tasks.filter(
                (t) =>
                  t.status !== "done" &&
                  t.dueDate.slice(0, 10) <
                    new Date().toLocaleDateString("en-CA", {
                      timeZone: "Europe/Moscow",
                    }),
              ).length
            }
          </p>
          <ul className="mt-3 space-y-2">
            {m.tasks.map((t) => (
              <li key={t.id}>
                <Link
                  className="text-sm text-flux"
                  to={"/dashboard/tasks/" + m.departmentId}
                >
                  {t.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
function Editor({
  workspaceId,
  meeting: m,
  onUpdate,
}: {
  workspaceId: string;
  meeting: LiveMeeting;
  onUpdate: (m: LiveMeeting) => void;
}) {
  const [summary, setSummary] = useState(m.analysis!.summary);
  const [decisions, setDecisions] = useState(m.analysis!.decisions.join("\n"));
  const [tasks, setTasks] = useState(m.analysis!.tasks);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update(index: number, patch: Partial<ProtocolTask>) {
    setTasks((rows) =>
      rows.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onUpdate(
        await meetingsApi.publish(
          workspaceId,
          m.id,
          m.analysisRevision,
          summary,
          decisions.split("\n").filter((v) => v.trim()),
          tasks,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="mt-6 space-y-4" onSubmit={publish}>
      <h3 className="font-semibold text-snow">
        Проверьте итоги перед публикацией
      </h3>
      <p className="text-sm text-fog">
        Заполните пропущенные сроки и критерии. Если ответственный неизвестен,
        оставьте задачу без исполнителя.
      </p>
      <label className="meeting-field">
        Итог
        <textarea
          required
          maxLength={10000}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>
      <label className="meeting-field">
        Решения, по одному на строку
        <textarea
          maxLength={50000}
          value={decisions}
          onChange={(e) => setDecisions(e.target.value)}
        />
      </label>
      {tasks.map((t, i) => (
        <fieldset
          key={i}
          className="space-y-3 rounded-lg border border-line p-4"
        >
          <legend className="px-2 text-sm text-fog">Задача {i + 1}</legend>
          <label className="meeting-field">
            Название
            <input
              required
              maxLength={200}
              value={t.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="meeting-field">
              С
              <input
                type="date"
                required
                value={t.startDate || ""}
                onChange={(e) => update(i, { startDate: e.target.value })}
              />
            </label>
            <label className="meeting-field">
              До
              <input
                type="date"
                required
                min={t.startDate || undefined}
                value={t.dueDate || ""}
                onChange={(e) => update(i, { dueDate: e.target.value })}
              />
            </label>
          </div>
          <label className="meeting-field">
            Критерий результата
            <input
              required
              maxLength={3000}
              value={t.successCriteria}
              onChange={(e) => update(i, { successCriteria: e.target.value })}
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm text-fog">
              Исполнители · {t.assigneeIds.length || "не назначены"}
            </legend>
            <div className="flex flex-wrap gap-3">
              {m.people.map((p) => (
                <label className="flex gap-2 text-sm text-mist" key={p.id}>
                  <input
                    type="checkbox"
                    checked={t.assigneeIds.includes(p.id)}
                    onChange={(e) =>
                      update(i, {
                        assigneeIds: e.target.checked
                          ? [...t.assigneeIds, p.id]
                          : t.assigneeIds.filter((id) => id !== p.id),
                      })
                    }
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="meeting-button danger"
            onClick={() => setTasks((rows) => rows.filter((_, j) => i !== j))}
          >
            Не создавать эту задачу
          </button>
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="text-crit">
          {error}
        </p>
      )}
      <button className="meeting-button primary" disabled={busy}>
        {busy
          ? "Публикуем…"
          : `Подтвердить протокол и создать задачи (${tasks.length})`}
      </button>
    </form>
  );
}
