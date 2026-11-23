import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../lib/extraction/server.ts";
const png = Buffer.from("89504e470d0a1a0a00000000", "hex");
const request = () => {
  const data = new FormData();
  data.set("image", new File([png], "schedule.png", { type: "image/png" }));
  return new Request("http://localhost/api/extract", {
    method: "POST",
    body: data,
  });
};
const entry = {
  subject: "Astronomy",
  day: "Mon",
  start: "09:00",
  end: "10:30",
  room: "A1",
};
const provider = (data) => async () =>
  Response.json({
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(data) }] },
      },
    ],
  });
test("missing key gives actionable setup error without contacting provider", async () => {
  assert.equal(typeof api.handleExtraction, "function");
  const response = await api.handleExtraction(request(), { apiKey: "" });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/);
});
test("valid results get IDs, duplicates removed, invalid sessions warned about", async () => {
  const response = await api.handleExtraction(request(), {
    apiKey: "test-key",
    fetch: provider({
      classes: [entry, entry, { ...entry, end: "08:00" }],
      warnings: [],
    }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.classes.length, 1);
  assert.ok(result.classes[0].id);
  assert.equal(result.classes[0].end, "10:30");
  assert.ok(result.warnings.some((x) => /invalid|skipped/i.test(x)));
});
test("key is sent in header only, image and schema go to Gemini", async () => {
  const response = await api.handleExtraction(request(), {
    apiKey: "secret-test",
    fetch: async (url, init) => {
      assert.ok(!url.includes("secret-test"));
      assert.equal(init.headers["x-goog-api-key"], "secret-test");
      const body = JSON.parse(init.body);
      assert.equal(body.contents[0].parts[1].inlineData.mimeType, "image/png");
      assert.ok(body.generationConfig.responseJsonSchema);
      return provider({ classes: [entry], warnings: [] })();
    },
  });
  assert.equal(response.status, 200);
  assert.ok(!(await response.text()).includes("secret-test"));
});
for (const status of [400, 403, 404, 429, 500])
  test(`provider ${status} returns safe actionable error`, async () => {
    const r = await api.handleExtraction(request(), {
      apiKey: "secret-test",
      fetch: async () => new Response("secret-test", { status }),
    });
    assert.ok(r.status >= 400);
    assert.ok(!(await r.text()).includes("secret-test"));
  });
test("malformed provider response is not presented as successful extraction", async () => {
  const r = await api.handleExtraction(request(), {
    apiKey: "test",
    fetch: async () =>
      Response.json({
        candidates: [
          { finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } },
        ],
      }),
  });
  assert.equal(r.status, 502);
});
test("empty schedule has a useful review warning", async () => {
  const r = await api.handleExtraction(request(), {
    apiKey: "test",
    fetch: provider({ classes: [], warnings: [] }),
  });
  assert.equal(r.status, 200);
  assert.match((await r.json()).warnings.join(" "), /no classes/i);
});
test("non-image bytes are rejected before provider call", async () => {
  const form = new FormData();
  form.set("image", new File(["bad"], "fake.png", { type: "image/png" }));
  const r = await api.handleExtraction(
    new Request("http://localhost/api/extract", { method: "POST", body: form }),
    {
      apiKey: "test",
      fetch: () => {
        throw Error("must not call");
      },
    },
  );
  assert.equal(r.status, 415);
});
test("cross-origin upload is rejected", async () => {
  const r = new Request(request(), {
    headers: { origin: "https://other.example" },
  });
  const response = await api.handleExtraction(r, { apiKey: "test" });
  assert.equal(response.status, 403);
});
