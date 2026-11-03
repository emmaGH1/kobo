'use client';
import { useState, type FormEvent } from 'react';

export default function DevPage() {
  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [reminderUrl, setReminderUrl] = useState('');
  const [result, setResult] = useState('Sign in to start. Demo data is fictional and isolated.');
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<{ id: string; title: string; description?: string }[]>([]);
  async function send(body: object) {
    setBusy(true);
    try {
      const res = await fetch('/api/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setResult(data.replyText ?? data.error ?? (res.ok ? 'Done.' : 'Request failed.'));
      const ui = data.interactive;
      setChoices(ui ? (ui.buttons ?? ui.rows ?? []) : []);
      setReminderUrl(typeof data.reminderUrl === 'string' && data.reminderUrl.startsWith('https://wa.me/') ? data.reminderUrl : '');
    } catch { setResult('Network error. Check before retrying a save.'); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent, body: object) { e.preventDefault(); void send(body); }
  return <main style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
    <style>{`main input, main button { border: 1px solid currentColor; padding: 0.3rem; margin: 0.2rem 0; } main button { cursor: pointer; } main h1 { font-weight: bold; } main form { margin: 0.5rem 0; } main a { text-decoration: underline; }`}</style>
    <h1>Kobo development console</h1><p>Testing only. Do not enter real customer data.</p>
    <form onSubmit={e => { submit(e, { action: 'login', mode: 'owner', passcode }); setPasscode(''); }}><label>Owner passcode <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)} /></label> <button disabled={busy}>Sign in</button></form>
    <button disabled={busy} onClick={() => void send({ action: 'login', mode: 'demo' })}>Start fictional demo</button>{' '}<button disabled={busy} onClick={() => void send({ action: 'logout' })}>Sign out</button>
    <form onSubmit={e => submit(e, { action: 'customer', name })}><label>Customer name <input value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label> <button disabled={busy}>Add customer</button></form>
    <form onSubmit={e => submit(e, { action: 'message', text })}><label>Message <input value={text} onChange={e => setText(e.target.value)} maxLength={4000} /></label> <button disabled={busy}>Send</button></form>
    <p>For an unambiguous review, use <code>credit sale: Ada Example: 1000: due 2030-02-28</code> (date optional), <code>payment: Ada Example: 100</code>, <code>opening debt: Ada Example: 100</code>, or <code>stock purchase: rice: 500</code>. Amounts are naira. Review and then send 1, 2 or 3.</p>
    <form onSubmit={e => submit(e, { action: 'reminder', name, phone })}><label>Reminder phone (international digits only) <input value={phone} onChange={e => setPhone(e.target.value)} /></label> <button disabled={busy}>Draft reminder for named customer</button></form>
    {reminderUrl && <p><a href={reminderUrl} target="_blank" rel="noreferrer">Open draft in WhatsApp (not sent)</a></p>}
    <pre style={{ whiteSpace: 'pre-wrap' }} aria-live="polite">{result}</pre>
    {choices.length > 0 && <div role="group" aria-label="Reply options">{choices.map(c => <button key={c.id} disabled={busy} title={c.description} onClick={() => void send({ action: 'interactive', id: c.id })}>{c.title}</button>)} <small>Typed replies (1, 2, 3 or the amount) also work.</small></div>}
  </main>;
}
