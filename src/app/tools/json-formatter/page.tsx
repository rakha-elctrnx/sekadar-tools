import type { Metadata } from "next";
import { JSONFormatterTool } from "./json-formatter-tool";

export const metadata: Metadata = {
  title: "JSON Formatter",
  description:
    "Beautify, minify, and validate JSON data instantly. Fast, free, and runs entirely in your browser.",
};

export default function JSONFormatterPage() {
  return <JSONFormatterTool />;
}
