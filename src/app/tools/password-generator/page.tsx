import type { Metadata } from "next";
import PasswordGeneratorTool from "./password-generator-tool";

export const metadata: Metadata = {
  title: "Password Generator",
  description:
    "Generate secure random passwords with customizable length and character options. Fast, free, and runs entirely in your browser.",
};

export default function PasswordGeneratorPage() {
  return <PasswordGeneratorTool />;
}
