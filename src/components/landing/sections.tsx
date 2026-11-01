import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { KoboLogo, KoboMark } from "@/components/kobo/logo";
import { NotchCard } from "@/components/kobo/notch-card";
import { WhatsAppDemo } from "@/components/chat/whatsapp-demo";

const wrap = "mx-auto w-full max-w-[1240px] px-5 md:px-8 lg:px-12";
const GITHUB = "https://github.com/emmaGH1/kobo";

export function Nav() {
  return (
    <div className={`${wrap} pt-4`}>
      <nav className="flex h-14 items-center justify-between rounded-full border border-ink/10 bg-[#F3ECDF] pl-4 pr-2 font-sans">
        <a href="#top" aria-label="Kobo home">
          <KoboLogo className="h-7 w-auto text-ink" />
        </a>
        <ul className="hidden items-center gap-8 text-[14px] text-ink-2 md:flex">
          <li><a className="hover:text-ink" href="#how">How it works</a></li>
          <li><a className="hover:text-ink" href="#features">What it keeps</a></li>
          <li><a className="hover:text-ink" href="#safety">Safety</a></li>
          <li><a className="hover:text-ink" href={GITHUB}>GitHub</a></li>
        </ul>
        <a href="#try" className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] text-paper">
          Try Kobo <ArrowDownRight className="size-4" strokeWidth={1.75} />
        </a>
      </nav>
    </div>
  );
}

const facts = [
  { n: "2", label: "Languages: Pidgin and English" },
  { n: "3", label: "Choices before anything saves" },
  { n: "0", label: "Amounts guessed. Kobo asks" },
];

export function Hero() {
  return (
    <section id="top" className={`${wrap} grid grid-cols-1 gap-10 pb-20 pt-10 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-10 lg:pb-28 lg:pt-12`}>
      <div className="min-w-0 self-end lg:col-span-6 lg:row-start-1">
        <p className="inline-flex h-8 items-center rounded-full border border-ink/40 px-3.5 font-sans text-[13px] text-ink-2">
          Bookkeeping for market traders, in WhatsApp
        </p>
        <h1 className="mt-6 text-[46px] leading-[1] tracking-[-0.03em] sm:text-[60px] lg:text-[64px] xl:text-[72px]">
          Your market notebook, <span className="text-ink-2">now inside WhatsApp.</span>
        </h1>
        <p className="mt-6 max-w-[44ch] font-sans text-[17px] leading-[1.6] text-ink-2">
          Send a voice note in Pidgin or English. Kobo writes it into your book, asks when a figure is
          unclear, and saves only when you say so.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 font-sans">
          <a href="#try" className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] text-paper">
            Try it on the phone <ArrowDownRight className="size-4" strokeWidth={1.75} />
          </a>
          <a href="#how" className="flex h-12 items-center rounded-full border border-ink/60 px-6 text-[15px] text-ink">
            How it works
          </a>
        </div>
      </div>

      <div className="order-3 min-w-0 self-start lg:order-none lg:col-span-6 lg:row-start-2">
        <dl className="grid max-w-[560px] grid-cols-3 divide-x divide-ink/20 border-t border-ink/20 pt-6">
          {facts.map((f) => (
            <div key={f.n + f.label} className="px-4 first:pl-0">
              <dt className="tnum text-[40px] leading-none lg:text-[48px]">{f.n}</dt>
              <dd className="mt-2 font-sans text-[13px] leading-snug text-ink-2">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div id="try" className="min-w-0 scroll-mt-6 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
        <NotchCard
          className="bg-lav px-3 pb-5 pt-[96px] sm:px-6 lg:pt-8"
          radius={36}
          notch={84}
          inner={24}
          tile={<ArrowDownRight className="size-6" strokeWidth={1.5} />}
        >
          <WhatsAppDemo />
        </NotchCard>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", t: "Speak", who: "AI interprets", d: "Send a voice note or a text, the way you'd tell your apprentice. Kobo picks out who, what and how much." },
  { n: "02", t: "Confirm", who: "You confirm", d: "Kobo shows exactly what it will write, with the balance before and after. Reply 1 save, 2 edit or 3 cancel." },
  { n: "03", t: "It’s in your book", who: "Code calculates", d: "Every total and balance is counted by code, never the AI. Mistakes are fixed with a new entry, so nothing is erased." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-6 bg-ink text-paper">
      <div className={`${wrap} py-20 lg:py-28`}>
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 className="text-[38px] leading-[1.02] tracking-[-0.025em] lg:col-span-6 lg:text-[56px]">
            Speak. Confirm. <span className="text-lav">It’s in your book.</span>
          </h2>
          <p className="max-w-[46ch] self-end font-sans text-[16px] leading-[1.6] text-paper/70 lg:col-span-5 lg:col-start-8">
            Kobo splits the job three ways on purpose. The AI only listens and proposes. You decide.
            Plain, tested code does the arithmetic.
          </p>
        </div>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-paper/15 lg:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="bg-ink p-7 lg:p-9">
              <div className="flex items-center justify-between font-sans text-[13px]">
                <span className="tnum text-paper/50">{s.n}</span>
                <span className="rounded-full border border-lav/60 px-3 py-1 text-lav">{s.who}</span>
              </div>
              <h3 className="mt-10 text-[30px] leading-tight tracking-[-0.02em]">{s.t}</h3>
              <p className="mt-3 font-sans text-[15px] leading-[1.6] text-paper/70">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Bubble({ children, out = false }: { children: React.ReactNode; out?: boolean }) {
  return (
    <div
      className={`max-w-[92%] rounded-[14px] px-3 py-2 font-sans text-[14px] leading-[1.4] text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
        out ? "self-end rounded-tr-[4px] bg-[#D9FDD3]" : "self-start rounded-tl-[4px] bg-white"
      }`}
    >
      {children}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className={`${wrap} scroll-mt-6 py-20 lg:py-28`}>
      <div className="grid gap-6 lg:grid-cols-12">
        <h2 className="text-[38px] leading-[1.02] tracking-[-0.025em] lg:col-span-7 lg:text-[56px]">
          Everything your notebook does, <span className="text-ink-2">without the arithmetic.</span>
        </h2>
        <p className="max-w-[42ch] self-end font-sans text-[16px] leading-[1.6] text-ink-2 lg:col-span-4 lg:col-start-9">
          No app to install and no forms. Kobo is a contact in the WhatsApp you already use all day.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <NotchCard className="flex flex-col justify-between bg-ink p-7 text-paper lg:col-span-7 lg:p-9" tile={<ArrowUpRight className="size-5" strokeWidth={1.5} />} tileClassName="bg-lav text-ink">
          <div>
            <p className="font-sans text-[13px] text-paper/60">Voice notes and text</p>
            <h3 className="mt-3 max-w-[18ch] pr-16 text-[32px] leading-[1.05] tracking-[-0.02em]">Talk am in Pidgin. Kobo go write am.</h3>
            <p className="mt-3 max-w-[44ch] font-sans text-[15px] leading-[1.6] text-paper/70">
              Speak the way you talk at the stall. When Kobo replies, it quotes back what it heard, so you
              can check it against your own words.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-1.5 rounded-[20px] bg-[#EFE7DD] p-3">
            <Bubble out>
              <span className="italic text-[#667781]">Voice note · 0:09</span>
              <br />
              Mama Chidi carry two bag rice, forty five thousand. She pay twenty thousand now.
            </Bubble>
            <Bubble>
              <span className="block border-l-[3px] border-black/15 pl-2 italic opacity-80">&ldquo;…forty five thousand… twenty thousand now.&rdquo;</span>
              Credit sale <b className="tnum">₦45,000</b> · paid <b className="tnum">₦20,000</b>
            </Bubble>
          </div>
        </NotchCard>

        <NotchCard className="bg-lav p-7 lg:col-span-5 lg:p-9" tile={<ArrowUpRight className="size-5" strokeWidth={1.5} />}>
          <p className="font-sans text-[13px] text-ink/70">Customer balances</p>
          <h3 className="mt-3 pr-16 text-[32px] leading-[1.05] tracking-[-0.02em]">“Who dey owe me?”</h3>
          <p className="mt-3 max-w-[36ch] font-sans text-[15px] leading-[1.6] text-ink/80">
            Ask any time. Kobo lists everyone who owes you, biggest first, and opens anyone’s history.
          </p>
          <ul className="mt-6 divide-y divide-ink/15 rounded-[18px] bg-paper/60 px-4 font-sans text-[15px]">
            {[
              ["Bayo", "₦28,000"],
              ["Iya Basira", "₦26,000"],
              ["Mama Chidi", "₦8,500"],
            ].map(([n, a]) => (
              <li key={n} className="flex justify-between py-2.5">
                <span>{n}</span>
                <span className="tnum font-medium text-owed">{a}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-sans text-[12px] text-ink/60">Sample customers</p>
        </NotchCard>

        {[
          { k: "Credit and part payments", t: "Sales on credit, paid bit by bit", d: "Record a sale, a part payment, or both in one sentence. The running balance updates after you confirm." },
          { k: "Every evening", t: "Your day on one card", d: "A receipt-style summary lands in your chat each evening: credit given, money collected, who owes the most." },
          { k: "Mistakes", t: "Undo without erasing", d: "Tap Undo and Kobo adds a correction, after you confirm. The original entry stays in the book." },
        ].map((f) => (
          <div key={f.t} className="rounded-[28px] border border-ink/15 bg-[#F3ECDF] p-7 lg:col-span-4">
            <p className="font-sans text-[13px] text-ink-2">{f.k}</p>
            <h3 className="mt-3 text-[26px] leading-[1.1] tracking-[-0.015em]">{f.t}</h3>
            <p className="mt-3 font-sans text-[15px] leading-[1.6] text-ink-2">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Safety() {
  return (
    <section id="safety" className={`${wrap} scroll-mt-6 pb-20 lg:pb-28`}>
      <NotchCard
        className="grid gap-10 bg-lav p-8 sm:p-10 lg:grid-cols-12 lg:p-14"
        radius={36}
        notch={96}
        inner={26}
        tile={<span className="font-sans text-[12px] tracking-wide">SAFE</span>}
      >
        <div className="lg:col-span-6">
          <h2 className="pr-20 text-[40px] leading-[1] tracking-[-0.03em] lg:pr-0 lg:text-[64px]">Kobo never guesses money.</h2>
          <p className="mt-6 max-w-[42ch] font-sans text-[16px] leading-[1.6] text-ink/80">
            Voice notes are messy. &ldquo;Three eight&rdquo; could be ₦3,800 or ₦38,000. When a figure can be read
            two ways, Kobo asks, and nothing is saved until you choose.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-[24px] bg-[#EFE7DD] p-4 lg:col-span-5 lg:col-start-8">
          <Bubble out>
            <span className="italic text-[#667781]">Voice note · 0:03</span>
            <br />
            Bayo pay me three eight
          </Bubble>
          <Bubble>
            I hear <b>&ldquo;three eight&rdquo;</b> for Bayo payment.
            <br />
            Which one be am?
            <span className="mt-1 block text-[12.5px] text-[#667781]">I never save anything.</span>
          </Bubble>
          <div className="flex gap-2">
            {["₦3,800", "₦38,000"].map((a) => (
              <span key={a} className="tnum flex-1 rounded-[12px] bg-white py-3 text-center font-serif text-[30px] leading-none text-[#027EB5] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                {a}
              </span>
            ))}
          </div>
          <p className="pt-1 text-center font-sans text-[12px] text-ink/60">The real message format, shown as an example</p>
        </div>
      </NotchCard>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12`}>
        <div className="lg:col-span-6">
          <KoboLogo tone="dark" className="h-10 w-auto text-paper" />
          <p className="mt-6 max-w-[30ch] text-[28px] leading-[1.1] tracking-[-0.02em]">
            Your market notebook, <span className="text-lav">now inside WhatsApp.</span>
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-8 font-sans text-[14px] lg:col-span-5 lg:col-start-8">
          <div>
            <dt className="text-paper/50">Built with</dt>
            <dd className="mt-2">Muse Spark and Muse Voice</dd>
          </div>
          <div>
            <dt className="text-paper/50">Code</dt>
            <dd className="mt-2">
              <a href={GITHUB} className="underline underline-offset-4">GitHub</a>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-paper/50">Made for</dt>
            <dd className="mt-2">Meta Global AI Developer Hackathon</dd>
          </div>
        </dl>
      </div>
      <div className={`${wrap} flex items-center gap-3 border-t border-paper/15 py-6 font-sans text-[12px] text-paper/50`}>
        <KoboMark className="size-5" /> Sample names and amounts on this page are demo data.
      </div>
    </footer>
  );
}
