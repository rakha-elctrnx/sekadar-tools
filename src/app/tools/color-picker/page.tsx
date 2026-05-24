import type { Metadata } from "next";
import { ColorPickerTool } from "./color-picker-tool";

export const metadata: Metadata = {
  title: "Color Picker",
  description:
    "Pick colors, generate shades & tints, explore harmonies, build gradients, check contrast, and simulate color blindness — all in your browser.",
};

export default function ColorPickerPage() {
  return <ColorPickerTool />;
}
