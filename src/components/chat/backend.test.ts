import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createChatBackend } from "./backend";

describe("Your turn backend adapter", () => {
  it("is the only file the chat UI uses to reach Kobo", () => {
    const ui = readFileSync(join(__dirname, "whatsapp-demo.tsx"), "utf8");
    expect(ui).not.toMatch(/demo-engine/);
    expect(ui).toMatch(/from "\.\/backend"/);
  });

  it("greets in the chosen language and replies with ReplyViews", async () => {
    const b = createChatBackend("pcm");
    expect(b.greeting("pcm").body).toContain("I be Kobo");
    expect(b.greeting("en").body).toContain("I'm Kobo");
    const r = await b.send({ text: "Who dey owe me" });
    expect(r.replies[0].kind).toBe("list");
    expect(r.remaining).toBe(b.limit - 1);
  });

  it("enforces the message limit but always lets choices through", async () => {
    const b = createChatBackend();
    for (let i = 0; i < b.limit; i++) await b.send({ text: "Who dey owe me" });
    const blocked = await b.send({ text: "Who dey owe me" });
    expect(blocked).toEqual({ replies: [], remaining: 0, limited: true });
    const choice = await b.send({ text: "1" });
    expect(choice.limited).toBeUndefined();
    expect((await b.reset()).remaining).toBe(b.limit);
  });

  it("switches reply language", async () => {
    const b = createChatBackend("pcm");
    b.setLanguage("en");
    const r = await b.send({ text: "Who owes me" });
    expect(r.replies[0].body).toContain("Who owes you");
  });
});
