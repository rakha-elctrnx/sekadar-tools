import type { Metadata } from "next";
import { ColorConverterTool } from "./color-converter-tool";

export const metadata: Metadata = {
  title: "Color Converter",
  description:
    "Convert colors instantly between HEX, RGB, HSL, and OKLCH formats. Fast, free, and runs entirely in your browser.",
};

export default function ColorConverterPage() {
  return <ColorConverterTool />;
}
