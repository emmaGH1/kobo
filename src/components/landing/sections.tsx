import { ArrowDown, ArrowUpRight } from "lucide-react";
import { KoboLogo, KoboMark } from "@/components/kobo/logo";
import { WhatsAppDemo } from "@/components/chat/whatsapp-demo";
import { Film } from "./film";
import { NotebookPhoto } from "./notebook-photo";

/*
 * v3 philosophy (docs/DESIGN.md): show the transformation, not the interface. The page is a
 * white sheet set in Geist Serif; lavender only ever marks what Kobo noticed; numbers are the
 * headline; nothing is boxed unless it is a real object (the phone, the book).
 */

const wrap = "mx-auto w-full max-w-[1280px] px-5 md:px-8 lg:px-12";
const GITHUB = "https://github.com/emmaGH1/kobo";
const label = "font-sans text-[12px] uppercase tracking-[0.14em] text-ink-3";

export function Nav() {
  return (
    <header className={`${wrap} flex h-20 items-center justify-between`}>
      <a href="#top" aria-label="Kobo home">
        <KoboLogo className="h-8 w-auto text-ink" />
      </a>
      <nav className="flex items-center gap-7 font-sans text-[14px] text-ink-2">
        <a className="hidden hover:text-ink md:inline" href="#film">The day</a>
        <a className="hidden hover:text-ink md:inline" href="#rule">The rule</a>
        <a className="hidden hover:text-ink md:inline" href="#keeps">What it keeps</a>
        <a className="hidden hover:text-ink md:inline" href={GITHUB}>GitHub</a>
        <a href="#try" className="flex h-10 items-center rounded-full bg-ink px-5 text-paper">Try it</a>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className={`${wrap} pt-4 lg:pt-10`}>
      <Film
        intro={
          <>
            <p className={label}>WhatsApp bookkeeping for Nigerian market traders</p>
            <h1 className="mt-4 text-[44px] leading-[0.96] tracking-[-0.035em] sm:text-[64px] lg:mt-6 lg:text-[68px] xl:text-[80px]">
              Talk your sales.
              <br />
              <span className="text-ink-2">
                Kobo keeps <span className="kmark">the book</span>.
              </span>
            </h1>
            <p className="mt-4 max-w-[34ch] font-sans text-[16px] leading-[1.55] text-ink-2 sm:hidden">
              Voice notes in, a clean book out. Nothing saved until you confirm.
            </p>
            <p className="mt-6 hidden max-w-[46ch] font-sans text-[18px] leading-[1.6] text-ink-2 sm:block">
              Send a voice note in Pidgin or English. Kobo records the stock you buy, what you sell on credit
              and who owes you, reminds you when payment is due, and saves nothing until you say so. Every
              total is counted by code, never guessed.
            </p>
          </>
        }
        actions={
          <div className="flex flex-wrap items-start gap-3 font-sans">
            <a href="#try" className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] text-paper">
              Try it yourself <ArrowDown className="size-4" strokeWidth={1.75} />
            </a>
            <a href="#film" className="flex h-12 items-center rounded-full border border-ink/25 px-6 text-[15px] text-ink hover:border-ink">
              Follow the day
            </a>
          </div>
        }
      />
    </section>
  );
}

const hands = [
  { who: "The AI listens.", d: "It turns a voice note into who, what and how much, and quotes back what it heard. It never does arithmetic." },
  { who: "You decide.", d: "Nothing enters the book until you reply 1 save. 2 edit and 3 cancel are always there." },
  { who: "Code counts.", d: "Totals and balances come from plain, tested code. Mistakes are fixed with a new entry, so nothing is erased." },
];

export function Principles() {
  return (
    <section className={`${wrap} py-24 lg:py-36`}>
      <p className={label}>How Kobo splits the work</p>
      <div className="mt-10 grid gap-12 lg:grid-cols-3 lg:gap-10">
        {hands.map((h, i) => (
          <div key={h.who} className="border-t border-ink pt-6">
            <span className="tnum font-sans text-[13px] text-ink-3">0{i + 1}</span>
            <h3 className="mt-6 text-[40px] leading-[1] tracking-[-0.025em] lg:text-[52px]">{h.who}</h3>
            <p className="mt-5 max-w-[34ch] font-sans text-[16px] leading-[1.6] text-ink-2">{h.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Rule() {
  return (
    <section id="rule" className="scroll-mt-4 bg-ink text-paper">
      <div className={`${wrap} py-24 lg:py-36`}>
        <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-paper/50">The rule Kobo never breaks</p>
        <p className="tnum mt-10 text-[64px] leading-[0.9] tracking-[-0.045em] sm:text-[104px] lg:text-[124px] xl:text-[140px]">
          ₦3,800
          <span className="mx-[0.12em] align-middle text-[0.32em] italic tracking-normal text-paper/45">or</span>
          <br className="lg:hidden" />
          ₦38,000?
        </p>
        <div className="mt-14 grid gap-10 border-t border-paper/15 pt-10 lg:grid-cols-12">
          <p className="text-[28px] leading-[1.15] tracking-[-0.015em] lg:col-span-5 lg:text-[34px]">
            A trader says <span className="kmark kmark-full text-ink">&ldquo;three eight&rdquo;</span>. Kobo doesn&apos;t pick one.
          </p>
          <p className="max-w-[48ch] font-sans text-[16px] leading-[1.65] text-paper/70 lg:col-span-5 lg:col-start-8">
            When a figure can be read two ways, Kobo shows both and waits. The same goes for a missing
            amount or a customer name it isn&apos;t sure of. Until you choose, the book doesn&apos;t change. A bookkeeper
            that guesses is worse than no bookkeeper.
          </p>
        </div>
      </div>
    </section>
  );
}

const keeps = [
  { t: "Stock you buy", d: "“I buy 5 bag rice from Alhaji, 290k.” Kobo records it as money out, so the day shows what you spent as well as what came in." },
  { t: "Sales on credit, paid bit by bit", d: "A sale, a part payment, or both in one sentence. Each customer’s running balance updates after you confirm." },
  { t: "Payment dates and reminders", d: "“The remain she go pay Friday.” Kobo turns that into a date and reminds you that morning, with a polite message ready for you to forward. It never messages your customers itself." },
  { t: "“Who dey owe me?”", d: "Everyone who owes you, biggest first, with each customer’s full history one tap away." },
  { t: "Your day on one page", d: "Every evening: credit sales, money collected, stock bought and who still owes, counted from the entries you confirmed." },
  { t: "Undo without erasing", d: "Tap Undo and Kobo adds a correction for you to confirm. The original entry stays in the book." },
];

export function Keeps() {
  return (
    <section id="keeps" className={`${wrap} scroll-mt-4 py-24 lg:py-36`}>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <h2 className="text-[44px] leading-[0.98] tracking-[-0.03em] lg:col-span-7 lg:text-[72px]">
          Everything the notebook did. <span className="text-ink-2">None of the arithmetic.</span>
        </h2>
        <NotebookPhoto className="lg:col-span-4 lg:col-start-9" />
      </div>
      <ol className="mt-16 border-t border-ink">
        {keeps.map((k, i) => (
          <li key={k.t} className="group grid gap-3 border-b border-ink/15 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8">
            <span className="tnum font-sans text-[13px] text-ink-3 lg:col-span-1">0{i + 1}</span>
            <h3 className="text-[28px] leading-[1.1] tracking-[-0.015em] lg:col-span-5 lg:text-[34px]">{k.t}</h3>
            <p className="max-w-[52ch] font-sans text-[16px] leading-[1.6] text-ink-2 lg:col-span-5 lg:col-start-8">{k.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Try() {
  return (
    <section id="try" className="scroll-mt-4 border-t border-ink/12 bg-[#FAFAF8]">
      <div className={`${wrap} py-24 lg:py-32`}>
        <WhatsAppDemo
          intro={
            <>
              <p className={label}>Your turn</p>
              <h2 className="mt-6 text-[44px] leading-[0.98] tracking-[-0.03em] lg:text-[72px]">Send Kobo a line.</h2>
              <p className="mt-6 max-w-[44ch] font-sans text-[16px] leading-[1.6] text-ink-2">
                Tap a message to send it, or type your own. This preview runs a scripted demo book with
                sample customers, using the real message formats.
              </p>
            </>
          }
        />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className={`${wrap} py-20`}>
        <KoboLogo tone="dark" className="h-12 w-auto text-paper" />
        <p className="mt-10 max-w-[18ch] text-[44px] leading-[0.98] tracking-[-0.03em] lg:text-[64px]">
          Talk your sales. <span className="text-paper/50">Kobo keeps the book.</span>
        </p>
        <dl className="mt-16 grid gap-8 border-t border-paper/15 pt-8 font-sans text-[14px] sm:grid-cols-3">
          <div>
            <dt className="text-paper/45">Built with</dt>
            <dd className="mt-2">Muse Spark and Muse Voice</dd>
          </div>
          <div>
            <dt className="text-paper/45">Code</dt>
            <dd className="mt-2">
              <a href={GITHUB} className="inline-flex items-center gap-1 underline underline-offset-4">
                GitHub <ArrowUpRight className="size-3.5" />
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-paper/45">Made for</dt>
            <dd className="mt-2">Meta Global AI Developer Hackathon</dd>
          </div>
        </dl>
        <p className="mt-12 flex items-center gap-3 font-sans text-[12px] text-paper/45">
          <KoboMark className="size-5" /> Names and amounts on this page are sample data.
        </p>
      </div>
    </footer>
  );
}
