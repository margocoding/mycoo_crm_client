import assert from "node:assert/strict";
import test from "node:test";
import axios, { AxiosError } from "axios";
import { installApiRetry, retryDelay, waitForRetry } from "./retry.ts";

function client(fail, options = {}) {
  let calls = 0;
  const requests = [], delays = [];
  const api = axios.create({ adapter: async (config) => {
    calls++;
    requests.push(config);
    const failure = fail(calls, config);
    if (failure) {
      const response = failure.status ? { status: failure.status, data: failure.data ?? {}, headers: failure.headers ?? {}, config } : undefined;
      throw new AxiosError("test failure", failure.code ?? (response ? "ERR_BAD_RESPONSE" : "ERR_NETWORK"), config, {}, response);
    }
    return { status: 200, statusText: "OK", data: { ok: true }, headers: {}, config };
  } });
  installApiRetry(api, { getSession: () => "session", random: () => 0, wait: async (ms) => { delays.push(ms); }, ...options });
  return { api, requests, delays, calls: () => calls };
}

test("GET recovers from transient failures and stops after the first success", async () => {
  const c = client((n) => n < 4 ? { status: 503 } : undefined);
  assert.deepEqual((await c.api.get("/tasks")).data, { ok: true });
  assert.equal(c.calls(), 4);
  assert.deepEqual(c.delays, [500, 1000, 2000]);
});

test("GET performs exactly five retries beyond the initial request", async () => {
  const c = client(() => ({ status: 502 }));
  await assert.rejects(c.api.get("/tasks"));
  assert.equal(c.calls(), 6);
  assert.deepEqual(c.delays, [500, 1000, 2000, 4000, 8000]);
});

test("network errors, timeouts, 408, 429 and temporary server errors are retried", async () => {
  for (const failure of [{}, { code: "ECONNABORTED" }, { code: "ETIMEDOUT" }, ...[408, 429, 500, 502, 503, 504].map(status => ({ status }))]) {
    const c = client((n) => n === 1 ? failure : undefined);
    await c.api.head("/tasks");
    assert.equal(c.calls(), 2);
  }
});

test("auth, validation, conflicts and configuration errors are never retried", async () => {
  for (const failure of [...[400, 401, 402, 403, 404, 409, 410, 422, 501].map(status => ({ status })), { code: "ERR_INVALID_URL" }]) {
    const c = client(() => failure);
    await assert.rejects(c.api.get("/tasks"));
    assert.equal(c.calls(), 1);
  }
});

test("backend retry exhaustion does not multiply provider attempts", async () => {
  for (const code of ["UPSTREAM_RETRIES_EXHAUSTED", "UPSTREAM_REQUEST_FAILED", "GIGACHAT_UNAVAILABLE"]) {
    const c = client(() => ({ status: 503, data: { code } }));
    await assert.rejects(c.api.post("/join", {}, { retrySafe: true }));
    assert.equal(c.calls(), 1);
  }
});

test("writes are not replayed without explicit idempotency opt-in", async () => {
  for (const method of ["post", "patch", "put", "delete"]) {
    const c = client(() => ({ status: 503 }));
    await assert.rejects(c.api.request({ url: "/tasks", method, data: { title: "task" } }));
    assert.equal(c.calls(), 1);
  }
});

test("opted-in POST retains the same request identifier and body", async () => {
  const c = client((n) => n < 3 ? {} : undefined);
  const data = { text: "test", requestId: "stable-id" };
  await c.api.post("/messages", data, { retrySafe: true });
  assert.equal(c.calls(), 3);
  assert.ok(c.requests.every(r => r.data === JSON.stringify(data)));
});

test("abort during retry delay prevents further attempts", async () => {
  const controller = new AbortController();
  const c = client(() => ({}), { wait: async (_ms, signal) => { controller.abort(); await waitForRetry(10_000, signal); } });
  await assert.rejects(c.api.get("/tasks", { signal: controller.signal }), axios.isCancel);
  assert.equal(c.calls(), 1);
});

test("an in-flight delay is cancellable without waiting for its timer", async () => {
  const controller = new AbortController();
  const waiting = waitForRetry(10_000, controller.signal);
  controller.abort();
  await assert.rejects(waiting, axios.isCancel);
});

test("logout or account change cancels an authenticated retry", async () => {
  let session = "first";
  const c = client(() => ({}), { getSession: () => session, wait: async () => { session = "second"; } });
  await assert.rejects(c.api.get("/tasks", { headers: { Authorization: "Bearer first" } }), axios.isCancel);
  assert.equal(c.calls(), 1);
});

test("public guest reads remain independent of CRM authentication", async () => {
  let session = "first";
  const c = client(n => n === 1 ? {} : undefined, { getSession: () => session, wait: async () => { session = null; } });
  await c.api.get("/meetings/join/link", { headers: { "X-Meeting-Guest-Key": "same-key" } });
  assert.equal(c.calls(), 2);
  assert.ok(c.requests.every(r => r.headers["X-Meeting-Guest-Key"] === "same-key"));
});

test("Retry-After seconds and dates are respected with a bounded wait", () => {
  const now = Date.parse("2026-11-04T12:00:00Z");
  assert.equal(retryDelay(0, "3", now, () => 0), 3000);
  assert.equal(retryDelay(0, "Wed, 04 Nov 2026 12:00:05 GMT", now, () => 0), 5000);
  assert.equal(retryDelay(0, "999999", now, () => 0), 10_000);
  assert.equal(retryDelay(0, "invalid", now, () => 0), 500);
  assert.equal(retryDelay(0, "-1", now, () => 0), 500);
  assert.equal(retryDelay(0, undefined, now, () => 0.5), 625);
});
