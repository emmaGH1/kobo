import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/policy-page";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — Kobo",
  description: "How to request manual review and deletion of information held by Kobo, and the limits of that process.",
};

export default function DataDeletionPage() {
  return <PolicyPage document="DATA_DELETION" />;
}
