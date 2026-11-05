PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS owners (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, passcode_hash TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0 CHECK(is_demo IN (0,1))
);
CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), name TEXT NOT NULL,
 UNIQUE(owner_id, name), UNIQUE(owner_id, id)
);
CREATE TABLE IF NOT EXISTS customer_aliases (
 owner_id TEXT NOT NULL, customer_id TEXT NOT NULL, alias TEXT NOT NULL COLLATE NOCASE,
 PRIMARY KEY(owner_id, alias), FOREIGN KEY(owner_id, customer_id) REFERENCES customers(owner_id, id)
);
CREATE TABLE IF NOT EXISTS pending_actions (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), channel TEXT NOT NULL,
 sender_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, raw_input TEXT NOT NULL,
 proposal_json TEXT NOT NULL, flags_json TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('review','editing','confirmed','cancelled','superseded')),
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 confirm_ref INTEGER, confirmed_at INTEGER,
 UNIQUE(owner_id, idempotency_key), UNIQUE(owner_id, id)
);
CREATE TABLE IF NOT EXISTS sender_prefs (
 owner_id TEXT NOT NULL REFERENCES owners(id), channel TEXT NOT NULL, sender_id TEXT NOT NULL,
 language TEXT NOT NULL CHECK(language IN ('en','pg')), explicit_choice INTEGER NOT NULL,
 PRIMARY KEY(owner_id, channel, sender_id)
);
/** One-turn, short-lived reference only; never inferred from debtor lists or pending transactions. */
CREATE TABLE IF NOT EXISTS recent_customer_context (
 owner_id TEXT NOT NULL, channel TEXT NOT NULL, sender_id TEXT NOT NULL,
 customer_id TEXT, mentioned_at INTEGER NOT NULL, turn_token TEXT NOT NULL,
 PRIMARY KEY(owner_id, channel, sender_id),
 FOREIGN KEY(owner_id, customer_id) REFERENCES customers(owner_id, id)
);
CREATE TABLE IF NOT EXISTS ledger_events (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), customer_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('sale','payment','opening_debt','reversal')),
 amount_kobo INTEGER NOT NULL CHECK(typeof(amount_kobo)='integer' AND amount_kobo > 0 AND amount_kobo <= 9007199254740991),
 reversal_of TEXT UNIQUE REFERENCES ledger_events(id), pending_id TEXT NOT NULL,
 sequence INTEGER NOT NULL, occurred_at INTEGER NOT NULL,
 FOREIGN KEY(owner_id, customer_id) REFERENCES customers(owner_id, id),
 FOREIGN KEY(owner_id, pending_id) REFERENCES pending_actions(owner_id, id),
 CHECK((kind='reversal' AND reversal_of IS NOT NULL) OR (kind!='reversal' AND reversal_of IS NULL)),
 UNIQUE(pending_id, sequence)
);
CREATE TABLE IF NOT EXISTS evidence (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), event_id TEXT NOT NULL REFERENCES ledger_events(id),
 transcript TEXT NOT NULL, audio_path TEXT
);
CREATE TABLE IF NOT EXISTS stock_purchases (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), description TEXT NOT NULL,
 amount_kobo INTEGER NOT NULL CHECK(typeof(amount_kobo)='integer' AND amount_kobo > 0 AND amount_kobo <= 9007199254740991),
 pending_id TEXT NOT NULL, occurred_at INTEGER NOT NULL,
 FOREIGN KEY(owner_id, pending_id) REFERENCES pending_actions(owner_id, id), UNIQUE(pending_id)
);
CREATE TRIGGER IF NOT EXISTS stock_no_update BEFORE UPDATE ON stock_purchases BEGIN SELECT RAISE(ABORT, 'stock purchases are append-only'); END;
CREATE TRIGGER IF NOT EXISTS stock_no_delete BEFORE DELETE ON stock_purchases BEGIN SELECT RAISE(ABORT, 'stock purchases are append-only'); END;
CREATE INDEX IF NOT EXISTS ledger_owner ON ledger_events(owner_id, occurred_at);
CREATE INDEX IF NOT EXISTS pending_conversation ON pending_actions(owner_id, channel, sender_id, status);
CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger_events BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;
CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger_events BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;
CREATE TRIGGER IF NOT EXISTS reversal_guard BEFORE INSERT ON ledger_events WHEN NEW.kind='reversal' BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM ledger_events e WHERE e.id=NEW.reversal_of AND e.owner_id=NEW.owner_id
 AND e.customer_id=NEW.customer_id AND e.amount_kobo=NEW.amount_kobo AND e.kind!='reversal'
 ) THEN RAISE(ABORT, 'invalid reversal') END;
END;
