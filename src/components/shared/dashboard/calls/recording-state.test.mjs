import assert from "node:assert/strict";
import test from "node:test";
import { recordingState } from "./recording-state.ts";
import { DisconnectReason } from "livekit-client";
import { parseMediaChoices, parseMediaPreference, shouldReconnect, unreadChatCount } from "./call-policy.ts";

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
