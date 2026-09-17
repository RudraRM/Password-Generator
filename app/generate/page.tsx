import type { Metadata } from "next";
import { Generator } from "@/components/Generator";

export const metadata: Metadata = {
  title: "Password generator",
  description:
    "Choose a length from 6–64 characters and generate a secure password locally with Keyform.",
};
export default function GeneratorPage() {
  return <Generator />;
}
