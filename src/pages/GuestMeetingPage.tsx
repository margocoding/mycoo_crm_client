import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LuArrowRight, LuCalendar, LuVideo } from "react-icons/lu";
import { ApiError, errorMessage } from "@/api/base.api";
import { guestMeetingsApi, type PublicMeeting } from "@/api/guest-meetings.api";
import type { CallMeeting } from "@/types/meetings.types";
import { MeetingBadge, formatMeetingDate, formatMeetingTime } from "@/components/shared/dashboard/calls/MeetingUI";
import "@/components/shared/dashboard/calls/meetings.css";

const LiveCall = lazy(() => import("@/components/shared/dashboard/calls/LiveCall"));
type GuestSession = { guestKey: string; name: string };
const sessionKey = (token: string) => "mycoo:meeting-guest:" + token;
function readSession(token: string): GuestSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey(token)) || "null");
    return value && typeof value.name === "string" && value.name.trim() &&
      typeof value.guestKey === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value.guestKey)
      ? { guestKey: value.guestKey, name: value.name.slice(0, 80) } : null;
  } catch {
    return null;
  }
}

export default function GuestMeetingPage() {
  const { token = "" } = useParams();
  return <GuestMeeting key={token} token={token} />;
}

function GuestMeeting({ token }: { token: string }) {
  const [session, setSession] = useState<GuestSession | null>(() => readSession(token));
  const [name, setName] = useState(session?.name || "");
  const [meeting, setMeeting] = useState<PublicMeeting | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [paused, setPaused] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (paused) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      let stop = false;
      try {
        const info = await guestMeetingsApi.get(token, session?.guestKey, controller.signal);
        if (controller.signal.aborted) return;
        setMeeting(info);
        setError("");
        stop = ["completed", "cancelled"].includes(info.status) ||
          ["removed", "expired"].includes(info.guestState);
        if (stop) setJoining(false);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(errorMessage(e));
        if (e instanceof ApiError && [400, 401, 403, 404, 410].includes(e.status)) {
          setMeeting(null);
          setJoining(false);
          stop = true;
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
      if (!controller.signal.aborted && !stop) timer = setTimeout(() => void poll(), 5000);
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [token, session?.guestKey, paused, refresh]);

  const joinCall = useCallback(async (signal: AbortSignal) => {
    if (!session) throw new Error("Укажите имя перед входом.");
    const result = await guestMeetingsApi.join(token, session.name, session.guestKey, signal);
    if (!signal.aborted) setMeeting((current) => current ? {
      ...current,
      identity: result.identity || current.identity,
      guestState: result.waiting ? "waiting" : "admitted",
    } : current);
    return result;
  }, [token, session]);

  const action = useCallback(async (name: string) => {
    if (!session || (name !== "raise" && name !== "lower")) return;
    const info = await guestMeetingsApi.action(token, session.guestKey, name);
    setMeeting(info);
  }, [token, session]);

  const identity = meeting?.identity || "guest-preview";
  const callMeeting: CallMeeting | null = meeting && session ? {
    ...meeting,
    startedAt: meeting.startedAt || undefined,
    guestInviteToken: token,
    myRole: "participant",
    canHost: false,
    canModerate: false,
    participants: meeting.participants.some((p) => p.personId === identity)
      ? meeting.participants
      : [...meeting.participants, {
          personId: identity, name: session.name, role: "participant", isGuest: true,
          admitted: meeting.guestState === "admitted", removed: false, raisedHand: false,
        }],
  } : null;
  const unavailable = meeting?.guestState === "removed"
    ? "Организатор удалил вас из встречи. Повторный вход недоступен."
    : meeting?.guestState === "expired"
      ? "Время гостевого доступа истекло. Обратитесь к организатору."
      : meeting?.status === "completed"
        ? "Встреча завершена."
        : meeting?.status === "cancelled" ? "Встреча отменена." : "";
  const canJoin = meeting?.status === "live" && meeting.callsAvailable && !meeting.locked && !unavailable;

  return (
    <main className="meetings-ui min-h-screen bg-void px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 border-b border-line pb-5 font-display text-sm font-bold tracking-widest text-snow">
          MYCOO <span className="ml-3 text-fog">/ ВСТРЕЧА</span>
        </header>
        {joining && callMeeting && !unavailable ? (
          <Suspense fallback={<p className="p-6 text-fog">Подключаем видеосвязь…</p>}>
            <LiveCall
              workspaceId=""
              meeting={callMeeting}
              userId={identity}
              joinCall={joinCall}
              action={action}
              onLeave={() => { setJoining(false); setPaused(true); setNotice("Вы вышли из встречи."); }}
            />
          </Suspense>
        ) : (
          <section className="meeting-page mx-auto max-w-xl space-y-6">
            {loading && <p role="status" className="text-fog">Загружаем встречу…</p>}
            {error && <p role="alert" className="text-sm text-crit">{error}</p>}
            {notice && !unavailable && <p role="status" className="text-sm text-flux">{notice}</p>}
            {meeting && <>
              <MeetingBadge status={meeting.status} />
              <h1 className="break-words font-display text-2xl font-bold text-snow">{meeting.title}</h1>
              <p className="flex items-center gap-2 text-sm text-fog"><LuCalendar />
                {formatMeetingDate(meeting.startsAt)} · {formatMeetingTime(meeting.startsAt)} · {meeting.duration} мин
              </p>
              {unavailable ? <p role="status" className="text-mist">{unavailable}</p> : <>
                <p className="text-sm leading-6 text-fog">Для участия достаточно указать имя. Регистрация не нужна.</p>
                {meeting.status === "scheduled" && <p role="status" className="text-sm text-fog">Ожидаем начала встречи. Организатор ещё не открыл звонок.</p>}
                {meeting.status === "live" && meeting.locked && <p role="status" className="text-sm text-warn">Организатор закрыл вход во встречу.</p>}
                {!meeting.callsAvailable && <p role="status" className="text-sm text-warn">Видеосвязь сейчас недоступна. Попробуйте позже.</p>}
                <form className="space-y-5" onSubmit={(event) => {
                  event.preventDefault();
                  if (!canJoin || !name.trim()) return;
                  const next = { guestKey: session?.guestKey || crypto.randomUUID(), name: name.trim() };
                  try { sessionStorage.setItem(sessionKey(token), JSON.stringify(next)); } catch { /* Session still works until reload. */ }
                  setSession(next);
                  setError("");
                  setNotice("");
                  setPaused(false);
                  setJoining(true);
                }}>
                  <label className="meeting-field">Ваше имя
                    <input required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя и фамилия" />
                  </label>
                  <button disabled={!canJoin || !name.trim()} className="meeting-button primary w-full" type="submit">
                    <LuVideo /> Подключиться <LuArrowRight />
                  </button>
                  {meeting.waitingRoom && <p className="text-xs leading-5 text-fog">Перед входом организатор допустит вас из зала ожидания.</p>}
                </form>
              </>}
            </>}
            {(!meeting && !loading || paused && !joining) && <button className="meeting-button" onClick={() => {
              setPaused(false); setRefresh((value) => value + 1);
            }}>Обновить встречу</button>}
          </section>
        )}
      </div>
    </main>
  );
}
