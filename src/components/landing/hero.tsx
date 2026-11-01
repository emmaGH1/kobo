import { KoboLogo } from "@/components/kobo/logo";
import { ChatPanel } from "@/components/chat/chat-panel";

export function TopBar() {
  return (
    <header className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-5 md:px-8 lg:px-12">
      <KoboLogo className="h-6 w-auto text-ink" />
      <a
        href="https://github.com/emmaGH1/kobo"
        className="text-[15px] text-ink underline-offset-4 hover:underline"
      >
        GitHub
      </a>
    </header>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 pb-16 pt-6 md:px-8 lg:min-h-[720px] lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-24 lg:pt-12">
      <div className="flex min-w-0 flex-col justify-between gap-6 lg:col-span-5 lg:gap-12">
        <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] lg:text-[72px]">
          Your market notebook, <span className="text-ink-2">now inside WhatsApp.</span>
        </h1>
        <p className="max-w-[34ch] text-[17px] leading-7 text-ink-2 lg:text-[18px]">
          Talk or type your sales in Pidgin or English. Kobo writes them down, asks when a figure is
          unclear, and saves only when you say so.
        </p>
      </div>
      <div className="min-w-0 lg:col-span-6 lg:col-start-7">
        <ChatPanel className="h-[min(72svh,600px)] lg:h-[640px]" />
      </div>
    </section>
  );
}
