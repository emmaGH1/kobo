const steps = [
  {
    n: "1",
    title: "Speak",
    copy: (
      <>
        Send a voice note or text, like you&apos;d tell your apprentice. <b>AI interprets</b> what you
        said: names, items, amounts.
      </>
    ),
    fragment: (
      <>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">Voice note</p>
        <blockquote className="border-l-2 border-rule pl-3 italic text-ink-2">
          &ldquo;Mama Chidi carry two bag rice, forty five thousand. She pay twenty thousand now.&rdquo;
        </blockquote>
      </>
    ),
  },
  {
    n: "2",
    title: "Confirm",
    copy: (
      <>
        Kobo shows exactly what it will write. <b>You confirm</b> with 1 save, 2 edit or 3 cancel.
      </>
    ),
    fragment: (
      <>
        <p>
          <b className="tnum">₦45,000</b> credit sale · <b className="tnum">₦20,000</b> paid
        </p>
        <p className="mt-2 border-t border-rule pt-2 font-mono text-[12px] text-ink-2">1 save / 2 edit / 3 cancel</p>
      </>
    ),
  },
  {
    n: "3",
    title: "It’s in your book",
    copy: (
      <>
        <b>Code calculates</b> every total and balance, never the AI. Corrections are new entries, so
        nothing is erased.
      </>
    ),
    fragment: (
      <>
        <p className="font-semibold">Mama Chidi</p>
        <p className="text-[15px]">
          now owes you <b className="tnum text-owed">₦33,500</b>
        </p>
        <p className="mt-2 font-mono text-[12px] text-ink-2">Ref K-0001</p>
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 lg:px-12 lg:py-32">
      <h2 className="max-w-[18ch] text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] lg:text-[44px]">
        Speak. Confirm. <span className="text-ink-2">It&apos;s in your book.</span>
      </h2>
      <ol className="mt-10 grid border-y border-ink/20 lg:mt-16 lg:grid-cols-3 lg:divide-x lg:divide-rule">
        {steps.map((s) => (
          <li key={s.n} className="border-b border-rule px-0 py-8 last:border-b-0 lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:pr-0">
            <span className="tnum text-[32px] font-semibold leading-none text-biro lg:text-[40px]">{s.n}</span>
            <h3 className="mt-3 text-[20px] font-semibold leading-6 lg:text-[24px]">{s.title}</h3>
            <p className="mt-2 max-w-[36ch] text-[17px] leading-7 text-ink-2 [&_b]:font-semibold [&_b]:text-ink">{s.copy}</p>
            <div className="mt-5 max-w-[360px] rounded-lg border border-rule bg-paper p-3 text-[15px] leading-6">{s.fragment}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
