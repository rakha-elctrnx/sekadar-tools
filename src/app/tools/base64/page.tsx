import type { Metadata } from "next";
import { Base64Tool } from "./base64-tool";

export const metadata: Metadata = {
  title: "Base64 Encode / Decode",
  description:
    "Encode text to Base64 or decode Base64 back to plain text. Supports UTF-8 encoding. Fast, free, and runs entirely in your browser.",
};

export default function Base64Page() {
  return <Base64Tool />;
}
