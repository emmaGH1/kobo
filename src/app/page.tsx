import { Features, Footer, Hero, HowItWorks, Nav, Safety } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Safety />
      </main>
      <Footer />
    </>
  );
}
