export function Footer() {
  return (
    <footer className="border-t border-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-12 md:px-8 lg:flex-row lg:items-baseline lg:justify-between lg:px-12">
        <p className="text-[15px]">
          Built with <b className="font-semibold">Muse Spark</b> and <b className="font-semibold">Muse Voice</b>
        </p>
        <a href="https://github.com/emmaGH1/kobo" className="text-[15px] underline underline-offset-4">
          GitHub
        </a>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
          Made for the Meta Global AI Developer Hackathon
        </p>
      </div>
    </footer>
  );
}
