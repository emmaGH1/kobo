import { describe, expect, it, vi } from 'vitest';
import type { InteractiveReply, MessageReply } from '../../core/contract';
vi.mock('../web', () => ({ service: vi.fn(), store: vi.fn() }));
import { outgoing } from './whatsapp';

const to = '2348000000000';
const actions = ['save', 'edit', 'cancel'].map((action, i) => ({ id: `${action}:review`, title: `${i + 1} ${action}` }));
const buttons: InteractiveReply = { kind: 'buttons', body: 'Shortened review', footer: '1 save / 2 edit / 3 cancel', buttons: actions };
const list: InteractiveReply = { kind: 'list', body: 'Shortened question', listButton: 'Choose customer', rows: [
  { id: 'answer:review:1', title: 'Ada', description: 'Owes ₦3,800' },
  { id: 'answer:review:2', title: 'New customer' },
] };
// A local wire shape keeps assertions typed without broadening the adapter's API.
type Payload = { messaging_product: string; recipient_type: string; to: string; type: 'text' | 'interactive'; text?: { body: string }; interactive?: {
  type: 'button' | 'list'; body: { text: string }; footer?: { text: string }; action: {
    buttons?: { type: string; reply: { id: string; title: string } }[];
    button?: string; sections?: { rows: { id: string; title: string; description?: string }[] }[];
  };
} };
const render = (reply: MessageReply) => outgoing(to, reply) as Payload[];
const bodies = (messages: Payload[]) => messages.map(m => m.text?.body ?? m.interactive!.body.text);
function withinLimits(messages: Payload[]) {
  for (const m of messages) {
    expect(m).toMatchObject({ messaging_product: 'whatsapp', recipient_type: 'individual', to });
    const body = m.text?.body ?? m.interactive!.body.text;
    expect(body.length).toBeGreaterThan(0);
    expect(body.length).toBeLessThanOrEqual(m.type === 'text' ? 4096 : 1024);
    expect(body.isWellFormed()).toBe(true);
    if (!m.interactive) continue;
    if (m.interactive.footer) expect(m.interactive.footer.text.length).toBeLessThanOrEqual(60);
    const action = m.interactive.action;
    if (action.buttons) {
      expect(action.buttons.length).toBeLessThanOrEqual(3);
      for (const b of action.buttons) { expect(b.reply.title.length).toBeLessThanOrEqual(20); expect(b.reply.id.length).toBeLessThanOrEqual(100); }
    } else {
      expect(action.button!.length).toBeLessThanOrEqual(20);
      expect(action.sections).toHaveLength(1);
      expect(action.sections![0].rows.length).toBeLessThanOrEqual(10);
      for (const row of action.sections![0].rows) {
        expect(row.title.length).toBeLessThanOrEqual(24); expect(row.id.length).toBeLessThanOrEqual(100);
        if (row.description) expect(row.description.length).toBeLessThanOrEqual(72);
      }
    }
  }
}

describe('WhatsApp reply rendering without repeated reviews', () => {
  it.each([buttons, list])('sends one $kind interactive carrying the COMPLETE authoritative reply, not ui.body', ui => {
    const replyText = 'Ada owes ₦3,800. Nothing is saved yet.\n1 save / 2 edit / 3 cancel';
    const result = render({ replyText, interactive: ui });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 'interactive', interactive: { type: ui.kind === 'buttons' ? 'button' : 'list', body: { text: replyText } } });
    expect(bodies(result)).toEqual([replyText]);
    expect(result[0].interactive!.footer).toBeUndefined();
    if (ui.kind === 'buttons') expect(result[0].interactive!.action.buttons).toEqual(actions.map(reply => ({ type: 'reply', reply })));
    else expect(result[0].interactive!.action).toEqual({ button: ui.listButton, sections: [{ rows: ui.rows }] });
    withinLimits(result);
  });

  it('retains a distinct valid footer once, on buttons AND lists', () => {
    for (const ui of [buttons, list]) {
      const result = render({ replyText: 'Choose Ada or New customer.', interactive: { ...ui, footer: 'Nothing is saved yet.' } });
      expect(result[0].interactive!.footer).toEqual({ text: 'Nothing is saved yet.' });
      withinLimits(result);
    }
  });

  it.each([1, 1024, 1025, 4096, 4097, 13000])('sends plain text only with no interactive (%i UTF-16 units), without loss', size => {
    const replyText = '₦'.repeat(size);
    const result = render({ replyText });
    expect(result.every(m => m.type === 'text')).toBe(true);
    expect(bodies(result).join('')).toBe(replyText);
    expect(result.length).toBe(Math.ceil(size / 4096));
    withinLimits(result);
  });

  it.each([buttons, list])('uses one full-body interactive at exactly 1024 units for $kind', ui => {
    const result = render({ replyText: 'a'.repeat(1024), interactive: ui });
    expect(result).toHaveLength(1);
    expect(result[0].interactive!.body.text).toBe('a'.repeat(1024));
    withinLimits(result);
  });

  it.each([buttons, list])('preserves all long reply facts once, then distinct action-only $kind and unchanged IDs/labels', ui => {
    for (const size of [1025, 4096, 4097, 17000]) {
      const first = 'FIRST: ₦3,800\n', last = 'LAST: ₦38,000\n1 save / 2 edit / 3 cancel';
      const replyText = first + 'f'.repeat(size - first.length - last.length) + last;
      expect(replyText.length).toBe(size);
      const result = render({ replyText, interactive: ui });
      expect(result.slice(0, -1).every(m => m.type === 'text')).toBe(true);
      expect(bodies(result.slice(0, -1)).join('')).toBe(replyText);
      expect(result.filter(m => m.type === 'interactive')).toHaveLength(1);
      const interactive = result.at(-1)!.interactive!;
      expect(interactive.body.text).toBe('Choose an option for the reply above.');
      expect(interactive.body.text).not.toContain('FIRST');
      expect(interactive.body.text).not.toContain('LAST');
      if (ui.kind === 'buttons') expect(interactive.action.buttons!.map(b => b.reply)).toEqual(actions);
      else expect(interactive.action.sections![0].rows).toEqual(ui.rows);
      expect(interactive.footer).toBeUndefined();
      withinLimits(result);
    }
  });

  it('preserves astral, ZWJ emoji, flags, combining marks, whitespace and facts across chunk boundaries', () => {
    for (const grapheme of ['😀', '👩🏽‍💻', '🇳🇬', 'e\u0301']) {
      const replyText = `${'a'.repeat(4095)}${grapheme}\n\n₦3,800\t${grapheme.repeat(2000)}\n1 save / 2 edit / 3 cancel`;
      const result = render({ replyText, interactive: buttons });
      const chunks = bodies(result.slice(0, -1));
      expect(chunks[0]).toBe('a'.repeat(4095));
      expect(chunks[1].startsWith(grapheme)).toBe(true);
      expect(chunks.join('')).toBe(replyText);
      // All chunk boundaries are also grapheme boundaries in the original string.
      const ends = new Set(Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(replyText), s => s.index + s.segment.length));
      let end = 0;
      for (const chunk of chunks) { end += chunk.length; expect(ends.has(end)).toBe(true); }
      withinLimits(result);
    }
  });

  it('handles a pathological over-limit combining cluster losslessly, without splitting code points', () => {
    const replyText = `😀${'\u0301'.repeat(9000)}`;
    const result = render({ replyText });
    expect(bodies(result).join('')).toBe(replyText);
    withinLimits(result);
  });

  it('preserves controls at every field limit, without truncation, with default list opener', () => {
    const buttonUi: InteractiveReply = { kind: 'buttons', body: '', footer: 'f'.repeat(60), buttons: Array.from({ length: 3 }, (_, i) => ({ id: `${i}${'i'.repeat(99)}`, title: `${i}${'t'.repeat(19)}` })) };
    const listUi: InteractiveReply = { kind: 'list', body: '', footer: 'f'.repeat(60), listButton: 'o'.repeat(20), rows: Array.from({ length: 10 }, (_, i) => ({ id: `${i}${'i'.repeat(99)}`, title: 't'.repeat(24), description: 'd'.repeat(72) })) };
    for (const ui of [buttonUi, listUi]) {
      const result = render({ replyText: 'Complete question', interactive: ui });
      expect(result).toHaveLength(1);
      withinLimits(result);
      const action = result[0].interactive!.action;
      if (ui.kind === 'buttons') expect(action.buttons!.map(b => b.reply)).toEqual(ui.buttons);
      else expect(action).toEqual({ button: ui.listButton, sections: [{ rows: ui.rows }] });
    }
    expect(render({ replyText: 'Question', interactive: { ...list, listButton: undefined } })[0].interactive!.action.button).toBe('Choose');
  });

  const invalid: [string, InteractiveReply][] = [
    ['no buttons', { ...buttons, buttons: [] }],
    ['missing buttons', { ...buttons, buttons: undefined }],
    ['too many buttons', { ...buttons, buttons: [...actions, { id: 'four', title: 'Four' }] }],
    ['long button title', { ...buttons, buttons: [{ id: 'save:review', title: 't'.repeat(21) }] }],
    ['empty title', { ...buttons, buttons: [{ id: 'save:review', title: '' }] }],
    ['blank title', { ...buttons, buttons: [{ id: 'save:review', title: '  ' }] }],
    ['broken Unicode title', { ...buttons, buttons: [{ id: 'save:review', title: '\ud83d' }] }],
    ['duplicate button title', { ...buttons, buttons: [actions[0], { ...actions[1], title: actions[0].title }] }],
    ['duplicate IDs', { ...buttons, buttons: [actions[0], { ...actions[1], id: actions[0].id }] }],
    ['empty ID', { ...buttons, buttons: [{ id: '', title: 'Save' }] }],
    ['whitespace in ID', { ...buttons, buttons: [{ id: ' save:review ', title: 'Save' }] }],
    ['ID rejected by inbound schema', { ...buttons, buttons: [{ id: 'i'.repeat(101), title: 'Save' }] }],
    ['long footer', { ...buttons, footer: 'f'.repeat(61) }],
    ['no list rows', { ...list, rows: [] }],
    ['missing list rows', { ...list, rows: undefined }],
    ['too many list rows', { ...list, rows: Array.from({ length: 11 }, (_, i) => ({ id: `answer:review:${i}`, title: `Row ${i}` })) }],
    ['duplicate row ID', { ...list, rows: [list.rows![0], list.rows![0]] }],
    ['long list title', { ...list, rows: [{ id: 'answer:review:1', title: 't'.repeat(25) }] }],
    ['long list description', { ...list, rows: [{ id: 'answer:review:1', title: 'Ada', description: 'd'.repeat(73) }] }],
    ['long list opener', { ...list, listButton: 'o'.repeat(21) }],
    ['empty list opener', { ...list, listButton: '' }],
    ['long list footer', { ...list, footer: 'f'.repeat(61) }],
  ];
  it.each(invalid)('invalid controls (%s) use complete typed equivalent, never a truncated subset', (_name, ui) => {
    for (const size of [0, 9000]) {
      const replyText = `Ada owes ₦3,800.${'f'.repeat(size)}\n1 save / 2 edit / 3 cancel`;
      const result = render({ replyText, interactive: ui });
      expect(result.every(m => m.type === 'text')).toBe(true);
      expect(bodies(result).join('')).toBe(replyText);
      withinLimits(result);
    }
  });

  it('keeps blocked reviews blocked: it never invents a Save control', () => {
    const blocked: InteractiveReply = { ...buttons, buttons: actions.slice(1) };
    for (const replyText of ['Needs an edit.\n2 edit / 3 cancel', `${'Needs an edit. '.repeat(400)}\n2 edit / 3 cancel`]) {
      const result = render({ replyText, interactive: blocked });
      expect(result.at(-1)!.interactive!.action.buttons!.map(b => b.reply)).toEqual(actions.slice(1));
      withinLimits(result);
    }
  });

  it('does not mutate the reply, pending ID or controls', () => {
    const reply: MessageReply = { replyText: 'Complete review\n1 save / 2 edit / 3 cancel', pending: { id: 'review', summary: 'Review', flags: [] }, interactive: buttons };
    const before = structuredClone(reply);
    render(reply); render(reply);
    expect(reply).toEqual(before);
  });
});
