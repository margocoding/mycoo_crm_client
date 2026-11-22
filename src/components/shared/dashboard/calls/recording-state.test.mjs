import assert from "node:assert/strict";
import test from "node:test";
import { recordingState } from "./recording-state.ts";
import { ConnectionState, DisconnectReason, ParticipantEvent, Room, RoomEvent, Track } from "livekit-client";
import { callConnectionError, parseMediaChoices, parseMediaPreference, shouldReconnect, unreadChatCount } from "./call-policy.ts";
import { rememberMediaState } from "./media-state.ts";

test("remembers individual media changes without overwriting the other device during startup", () => {
  const room = new Room();
  let choices = { audioEnabled: true, videoEnabled: true };
  const stop = rememberMediaState(room, (update) => { choices = { ...choices, ...update }; });
  room.state = ConnectionState.Connected;
  room.localParticipant.emit(ParticipantEvent.LocalTrackPublished, { source: Track.Source.Microphone, isMuted: false });
  assert.deepEqual(choices, { audioEnabled: true, videoEnabled: true });
  room.localParticipant.emit(ParticipantEvent.TrackMuted, { source: Track.Source.Microphone, isMuted: true });
  assert.deepEqual(choices, { audioEnabled: false, videoEnabled: true });
  room.localParticipant.emit(ParticipantEvent.TrackUnmuted, { source: Track.Source.Microphone, isMuted: false });
  room.localParticipant.emit(ParticipantEvent.TrackMuted, { source: Track.Source.Camera, isMuted: true });
  assert.deepEqual(choices, { audioEnabled: true, videoEnabled: false });
  stop();
});

test("transport teardown cannot overwrite media choices used for reconnecting", () => {
  const room = new Room();
  const changes = [];
  const stop = rememberMediaState(room, (update) => changes.push(update));
  for (const state of [ConnectionState.Connecting, ConnectionState.Reconnecting, ConnectionState.SignalReconnecting, ConnectionState.Disconnected]) {
    room.state = state;
    room.localParticipant.emit(ParticipantEvent.TrackMuted, { source: Track.Source.Microphone, isMuted: true });
  }
  room.state = ConnectionState.Connected;
  room.localParticipant.emit(ParticipantEvent.LocalTrackUnpublished, { source: Track.Source.Camera, isMuted: true });
  room.localParticipant.emit(ParticipantEvent.TrackMuted, { source: Track.Source.ScreenShare, isMuted: true });
  assert.deepEqual(changes, []);
  room.emit(RoomEvent.ActiveDeviceChanged, "audioinput", "selected-mic");
  room.emit(RoomEvent.ActiveDeviceChanged, "videoinput", "selected-camera");
  assert.deepEqual(changes, [{ audioDeviceId: "selected-mic" }, { videoDeviceId: "selected-camera" }]);
  stop();
  room.localParticipant.emit(ParticipantEvent.TrackUnmuted, { source: Track.Source.Camera, isMuted: false });
  room.emit(RoomEvent.ActiveDeviceChanged, "audioinput", "other-mic");
  assert.equal(changes.length, 2);
});

test("connection errors do not display bearer tokens", () => {
  const token = [{ alg: "HS256" }, { sub: "test" }]
    .map((value) => Buffer.from(JSON.stringify(value)).toString("base64url"))
    .concat("signature")
    .join(".");
  const expired = callConnectionError(`could not establish signal connection: invalid token: ${token}, error: token has invalid claims: token is expired`);
  assert.equal(expired.includes(token), false);
  assert.match(expired, /Повторите вход/);
  assert.equal(callConnectionError(`Connection failed: ${token}`), "Connection failed: [токен скрыт]");
  assert.equal(callConnectionError("Нет доступа к микрофону"), "Нет доступа к микрофону");
});

test("reconnects transport failures but never removal, duplicate sessions or closed meetings", () => {
  for (const reason of [DisconnectReason.SIGNAL_CLOSE, DisconnectReason.SERVER_SHUTDOWN, DisconnectReason.CONNECTION_TIMEOUT]) assert.equal(shouldReconnect(reason), true);
  for (const reason of [DisconnectReason.PARTICIPANT_REMOVED, DisconnectReason.ROOM_DELETED, DisconnectReason.ROOM_CLOSED, DisconnectReason.CLIENT_INITIATED, DisconnectReason.DUPLICATE_IDENTITY]) assert.equal(shouldReconnect(reason), false);
});
test("counts only unread messages from other participants", () => {
  const messages = [{ id: '1', from: { identity: 'other' } }, { id: '2', from: { identity: 'self' } }, { id: '3', from: { identity: 'other' } }];
  assert.equal(unreadChatCount(messages, new Set(['1']), 'self'), 1);
  assert.equal(unreadChatCount(messages, new Set(messages.map((m) => m.id)), 'self'), 0);
});
test("unknown or corrupt stored choices cannot silently enable camera or microphone", () => {
  assert.equal(parseMediaPreference('always'), 'once');
  for (const raw of [null, 'broken', '{"audioEnabled":"true","videoEnabled":"true"}']) {
    assert.equal(parseMediaChoices(raw).audioEnabled, false);
    assert.equal(parseMediaChoices(raw).videoEnabled, false);
  }
  assert.equal(parseMediaPreference('listen'), 'listen');
  assert.equal(parseMediaChoices('{"audioEnabled":true,"videoEnabled":false}').audioEnabled, true);
});

const row = (status, error = null) => ({
  id: status,
  status,
  error,
  createdAt: "2026-10-22T10:35:00Z",
  downloadable: false,
});

test("does not claim capture before Egress starts, and allows cancelling the request", () => {
  const state = recordingState([row("starting")]);
  assert.equal(state.capturing, false);
  assert.equal(state.pending, true);
  assert.equal(state.label, "Запись запускается");
});
test("surfaces the production starting error instead of claiming audio is being recorded", () => {
  const state = recordingState([row("starting", "Egress unavailable")]);
  assert.equal(state.capturing, false);
  assert.equal(state.label, "Ошибка записи");
  assert.equal(state.error, "Egress unavailable");
  assert.doesNotMatch(state.description, /Аудио записывается/);
});
test("shows capture only for a confirmed recording without an error", () => {
  assert.equal(recordingState([row("recording")]).capturing, true);
  assert.equal(
    recordingState([row("recording", "Status unavailable")]).capturing,
    false,
  );
});
test("distinguishes saving from capturing and disables repeated stops", () => {
  const state = recordingState([row("stopping")]);
  assert.equal(state.capturing, false);
  assert.equal(state.stopping, true);
  assert.equal(state.label, "Сохраняем запись");
});
test("does not keep an older failure after a newer recording succeeds", () => {
  const state = recordingState([row("failed", "Old error"), row("ready")]);
  assert.equal(state.error, "");
  assert.equal(state.label, "Запись сохранена");
  assert.equal(state.pending, false);
});
test("a saved fragment being transcribed does not block recording the next fragment", () => {
  const state = recordingState([row("transcribing")]);
  assert.equal(state.pending, false);
  assert.equal(state.stopping, false);
  assert.equal(recordingState([row("transcribing"), row("starting")]).label, "Запись запускается");
});
