export function Safety() {
  return (
    <section className="bg-night text-paper">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 md:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-32">
        <div className="lg:col-span-5">
          <h2 className="text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] lg:text-[44px]">
            Kobo never guesses money.
          </h2>
          <p className="mt-5 max-w-[40ch] text-[17px] leading-7 text-paper/80">
            Voice notes are messy. &ldquo;Three eight&rdquo; could be ₦3,800 or ₦38,000. When a figure can
            be read two ways, Kobo asks, and nothing is saved until you choose.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[#A39E92]">
            Example of the real message format
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="ml-auto max-w-[85%] rounded-[12px_2px_12px_12px] bg-paper/10 px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#A39E92]">Voice note</p>
            <p className="text-[17px] leading-7">Bayo pay me three eight</p>
          </div>
          <div className="mt-4 max-w-[92%] rounded-[2px_12px_12px_12px] border-l-2 border-biro-night bg-paper/[0.06] px-4 py-3 text-[17px] leading-7">
            <p>
              I hear <b>&ldquo;three eight&rdquo;</b> for Bayo payment.
            </p>
            <p>Which one be am?</p>
            <p className="mt-3 border-t border-paper/15 pt-2 font-mono text-[12px] text-[#A39E92]">I never save anything.</p>
          </div>
          <div className="relative mt-5 inline-block">
            <div className="flex gap-3 px-3 py-3">
              {["₦3,800", "₦38,000"].map((a) => (
                <span
                  key={a}
                  className="tnum rounded-[4px] border border-paper/40 px-5 py-3 text-[32px] font-semibold leading-none"
                >
                  {a}
                </span>
              ))}
            </div>
            {/* one hand-drawn biro circle around the pair: the motif's single use on this page */}
            <svg
              aria-hidden
              viewBox="0 0 360 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] overflow-visible"
            >
              <path
                d="M300 6 C200 -4 40 0 14 30 C-6 62 60 98 190 96 C310 94 372 68 350 30 C340 14 300 4 250 4"
                fill="none"
                stroke="var(--biro-night)"
                strokeWidth="3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
