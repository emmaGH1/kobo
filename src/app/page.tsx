import { Footer } from "@/components/landing/footer";
import { Hero, TopBar } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Safety } from "@/components/landing/safety";

export default function Home() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <HowItWorks />
        <Safety />
      </main>
      <Footer />
    </>
  );
}
