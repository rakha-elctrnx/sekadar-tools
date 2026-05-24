import type { Metadata } from "next";
import { EpochConverterTool } from "./epoch-converter-tool";

export const metadata: Metadata = {
  title: "Epoch / Unix Timestamp Converter | SekadarTools",
  description:
    "Convert Unix timestamps to human-readable dates and vice-versa instantly. Supports seconds, milliseconds, microseconds, and nanoseconds in real-time.",
};

export default function EpochConverterPage() {
  return <EpochConverterTool />;
}
