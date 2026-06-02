import type { Metadata } from "next";
import UUIDGeneratorTool from "./uuid-generator-tool";

export const metadata: Metadata = {
  title: "UUID Generator",
  description:
    "Generate universally unique identifiers (UUIDs) for various applications. Fast, free, and runs entirely in your browser.",
};

export default function UUIDGeneratorPage() {
  return <UUIDGeneratorTool />;
}