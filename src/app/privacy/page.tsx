import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Kobo",
  description: "How Kobo processes bookkeeping information, uses service providers and handles privacy requests.",
};

export default function PrivacyPage() {
  return <PolicyPage document="PRIVACY_POLICY" />;
}
