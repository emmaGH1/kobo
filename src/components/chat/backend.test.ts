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

describe("skip to Friday (demo clock, through the adapter)", () => {
  it("jumps to Friday 8:00 AM and returns the due reminder Kobo sends by itself", async () => {
    const b = createChatBackend("pcm");
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
    const b = createChatBackend("en");
    const r = await b.skipToFriday();
    expect(r.replies[0].body).toContain("Nothing is due today");
  });

  it("reset puts the clock back to real time", async () => {
    const b = createChatBackend();
    await b.skipToFriday();
    await b.reset();
    expect(b.clockLabel()).toBeNull();
  });
});
