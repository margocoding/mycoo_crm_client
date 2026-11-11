import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { meetingsApi } from "@/api/meetings.api";
import { errorMessage } from "@/api/base.api";
import "@/components/shared/dashboard/calls/meetings.css";

export default function SharedMeetingRecordingPage() {
  const { token = "" } = useParams();
  const [recording, setRecording] = useState<Awaited<
    ReturnType<typeof meetingsApi.sharedRecording>
  > | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setRecording(null);
    setError("");
    void meetingsApi
      .sharedRecording(token, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setRecording(value);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [token]);
  return (
    <main className="meetings-ui min-h-screen bg-void px-4 py-8 text-snow">
      <section className="meeting-panel mx-auto max-w-2xl space-y-5 p-6 md:p-8">
        <p className="font-display text-xs tracking-widest text-flux">
          MYCOO / ЗАПИСЬ ВСТРЕЧИ
        </p>
        <h1 className="break-words text-2xl font-semibold">
          {recording?.title || "Запись встречи"}
        </h1>
        {error && (
          <p role="alert" className="text-crit">
            {error}
          </p>
        )}
        {!recording && !error && (
          <p role="status" className="text-fog">
            Загружаем запись…
          </p>
        )}
        {recording && (
          <>
            <p className="text-sm text-fog">
              Организатор предоставил доступ к этому фрагменту до{" "}
              {new Date(recording.expiresAt).toLocaleDateString("ru-RU")}.
            </p>
            <button
              className="meeting-button primary"
              disabled={busy}
              onClick={async () => {
                const popup = window.open("about:blank", "_blank");
                if (popup) popup.opener = null;
                setBusy(true);
                setError("");
                try {
                  const fresh = await meetingsApi.sharedRecording(token);
                  if (popup) popup.location.replace(fresh.url);
                  else
                    setError(
                      "Разрешите открытие новой вкладки и попробуйте снова.",
                    );
                } catch (reason) {
                  popup?.close();
                  setError(errorMessage(reason));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Открываем…" : "Открыть и скачать запись"}
            </button>
            <p className="text-xs leading-5 text-fog">
              Для скачивания используйте меню видеоплеера. Ссылка открывает
              только эту запись.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
