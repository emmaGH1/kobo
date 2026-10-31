import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("database tooling smoke test (not a ledger)", () => {
  it("executes an in-memory SQLite query through Drizzle", () => {
    const sqlite = new Database(":memory:");
    try {
      const db = drizzle(sqlite);
      expect(db.get<{ value: number }>(sql`select 1 as value`)).toEqual({ value: 1 });
    } finally {
      sqlite.close();
    }
  });
});
