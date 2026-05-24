import type { Metadata } from "next";
import { RegexTesterTool } from "./regex-tester-tool";

export const metadata: Metadata = {
  title: "Regex Tester",
  description:
    "Test, debug, and learn Regular Expressions. Fast, free, and runs entirely in your browser.",
};

export default function RegexTesterPage() {
  return <RegexTesterTool />;
}
