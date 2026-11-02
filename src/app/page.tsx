import { Footer, Hero, Keeps, Nav, Principles, Rule, Try } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Principles />
        <Rule />
        <Keeps />
        <Try />
      </main>
      <Footer />
    </>
  );
}
