import assert from "node:assert/strict";
import test from "node:test";
import { recordingState } from "./recording-state.ts";

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
