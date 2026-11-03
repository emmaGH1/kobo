import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createApiBackend, createChatBackend, createScriptedBackend } from "./backend";
import type { ReplyView } from "./types";

describe("Your turn backend adapter", () => {
  it("is the only file the chat UI uses to reach Kobo", () => {
    const ui = readFileSync(join(__dirname, "whatsapp-demo.tsx"), "utf8");
    expect(ui).not.toMatch(/demo-engine/);
    expect(ui).toMatch(/from "\.\/backend"/);
  });

  it("greets in the chosen language and replies with ReplyViews", async () => {
    const b = createScriptedBackend("pcm");
    expect(b.greeting("pcm").body).toContain("I be Kobo");
    expect(b.greeting("en").body).toContain("I'm Kobo");
    const r = await b.send({ text: "Who dey owe me" });
    expect(r.replies[0].kind).toBe("list");
    expect(r.remaining).toBe(b.limit - 1);
  });

  it("enforces the message limit but always lets choices through", async () => {
    const b = createScriptedBackend();
    for (let i = 0; i < b.limit; i++) await b.send({ text: "Who dey owe me" });
    const blocked = await b.send({ text: "Who dey owe me" });
    expect(blocked).toEqual({ replies: [], remaining: 0, limited: true });
    const choice = await b.send({ text: "1" });
    expect(choice.limited).toBeUndefined();
    expect((await b.reset()).remaining).toBe(b.limit);
  });

  it("switches reply language", async () => {
    const b = createScriptedBackend("pcm");
    b.setLanguage("en");
    const r = await b.send({ text: "Who owes me" });
    expect(r.replies[0].body).toContain("Who owes you");
  });
});

describe("skip to Friday (demo clock, through the adapter)", () => {
  it("jumps to Friday 8:00 AM and returns the due reminder Kobo sends by itself", async () => {
    const b = createScriptedBackend("pcm");
    await b.send({ text: "Mama Chidi carry rice 45k, she pay 20k, remain Friday" });
    await b.send({ text: "1" });
    expect(b.clockLabel()).toBeNull();
    const before = (await b.send({ text: "1" })).remaining; // nothing pending; does not count
    const r = await b.skipToFriday();
    expect(r.dateLabel).toBe("Friday");
    expect(b.clockLabel()).toBe("8:00 AM");
    expect(r.remaining).toBe(before); // skipping is free
    expect(r.replies).toHaveLength(1);
    expect(r.replies[0].body).toContain("*Reminder* · Fri");
    expect(r.replies[0].body).toContain("*₦25,000*");
    expect(r.replies[0].buttons?.map((x) => x.title)).toEqual(["Draft message", "E don pay", "Remind me later"]);
    const draft = await b.send({ action: r.replies[0].buttons![0].id });
    expect(draft.replies[0].body).toContain("₦25,000 balance for the 2 bag rice");
    expect(b.clockLabel()).toBe("8:01 AM");
  });

  it("says nothing is due when there is no promised payment", async () => {
    const b = createScriptedBackend("en");
    const r = await b.skipToFriday();
    expect(r.replies[0].body).toContain("Nothing is due today");
  });

  it("reset puts the clock back to real time", async () => {
    const b = createScriptedBackend();
    await b.skipToFriday();
    await b.reset();
    expect(b.clockLabel()).toBeNull();
  });
});

describe("API backend (core /api/demo/*)", () => {
  function fake(routes: Record<string, (body: Record<string, unknown>, n: number) => [number, unknown?]>) {
    const calls: { op: string; body: Record<string, unknown> }[] = [];
    const counts: Record<string, number> = {};
    const f = (async (url: string, init?: RequestInit) => {
      const op = String(url).split("/").pop()!;
      const body = JSON.parse(String(init?.body ?? "{}"));
      calls.push({ op, body });
      counts[op] = (counts[op] ?? 0) + 1;
      const [status, json] = routes[op]?.(body, counts[op]) ?? [404, { error: "Not found" }];
      return new Response(JSON.stringify(json ?? {}), { status });
    }) as typeof fetch;
    return { f, calls };
  }
  const view = (body: string): ReplyView => ({ lang: "en", kind: "text", body });

  it("is what the chat UI uses, and has no voice sample until a consented clip exists", () => {
    const b = createChatBackend("pcm");
    expect(b.sampleVoice).toBeNull();
    expect(b.limit).toBe(12);
  });

  it("opens a session in the chosen language, then sends text and button ids", async () => {
    const { f, calls } = fake({
      session: () => [200, { remaining: 12 }],
      message: () => [200, { replies: [view("review")], remaining: 11 }],
      action: () => [200, { replies: [view("saved")], remaining: 11 }],
    });
    const b = createApiBackend("pcm", f);
    expect(await b.send({ text: "  Bayo pay me 3,800 " })).toEqual({ replies: [view("review")], remaining: 11 });
    expect(await b.send({ action: "save:abc" })).toEqual({ replies: [view("saved")], remaining: 11 });
    expect(calls.map((c) => c.op)).toEqual(["session", "message", "action"]);
    expect(calls[0].body).toEqual({ lang: "pcm" });
    expect(calls[1].body).toEqual({ text: "Bayo pay me 3,800" });
    expect(calls[2].body).toEqual({ action: "save:abc" });
  });

  it("maps 429 to the limit state and recreates an expired session once", async () => {
    const { f, calls } = fake({
      session: () => [200, { remaining: 12 }],
      message: (_b, n) => (n === 1 ? [401] : n === 2 ? [200, { replies: [view("ok")], remaining: 10 }] : [429, { reason: "demo_limit" }]),
    });
    const b = createApiBackend("en", f);
    expect((await b.send({ text: "hi" })).replies[0].body).toBe("ok");
    expect(calls.map((c) => c.op)).toEqual(["session", "message", "session", "message"]);
    expect(await b.send({ text: "again" })).toEqual({ replies: [], remaining: 0, limited: true });
  });

  it("throws on server errors so the UI shows its nothing-was-saved reply; 409 is a busy note", async () => {
    const { f } = fake({ session: () => [200, {}], message: (_b, n) => (n === 1 ? [409] : [500]) });
    const b = createApiBackend("en", f);
    expect((await b.send({ text: "a" })).replies[0].body).toContain("still working");
    await expect(b.send({ text: "b" })).rejects.toThrow("HTTP 500");
  });

  it("skips to the due day at 8:00 AM Lagos via the clock operation, and resets to real time", async () => {
    const at = Date.parse("2026-11-06T07:00:00Z"); // Friday 08:00 Lagos
    const { f, calls } = fake({
      session: () => [200, {}],
      clock: () => [200, { replies: [view("*Reminder*")], remaining: 12, simulated: true, simulatedAt: at }],
      action: () => [200, { replies: [view("draft")], remaining: 12 }],
      reset: () => [200, { remaining: 9 }],
      language: () => [200, {}],
    });
    const b = createApiBackend("en", f);
    const r = await b.skipToFriday();
    expect(calls.find((c) => c.op === "clock")?.body).toEqual({ to: "friday" });
    expect(r).toMatchObject({ dateLabel: "Friday", remaining: 12 });
    expect(b.clockLabel()).toBe("8:00 AM");
    await b.send({ action: "x" });
    expect(b.clockLabel()).toBe("8:01 AM");
    b.setLanguage("pcm");
    await new Promise((res) => setTimeout(res, 0));
    expect(calls.at(-1)).toEqual({ op: "language", body: { lang: "pcm" } });
    expect(await b.reset()).toEqual({ remaining: 9 });
    expect(calls.at(-1)).toEqual({ op: "reset", body: { lang: "pcm" } });
    expect(b.clockLabel()).toBeNull();
  });

  it("says nothing is due when core has no dated debt", async () => {
    const { f } = fake({ session: () => [200, {}], clock: () => [200, { replies: [], remaining: 12, simulated: true }] });
    expect((await createApiBackend("en", f).skipToFriday()).replies[0].body).toContain("Nothing is due today");
  });
});
