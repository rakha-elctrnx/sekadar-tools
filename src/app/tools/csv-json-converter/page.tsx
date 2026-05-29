import type { Metadata } from "next";
import { CsvJsonConverterTool } from "./csv-json-converter-tool";

export const metadata: Metadata = {
  title: "CSV ↔ JSON Converter",
  description:
    "Convert CSV data to JSON and JSON arrays to CSV format instantly. Fast, free, and runs entirely in your browser.",
};

export default function CsvJsonConverterPage() {
  return <CsvJsonConverterTool />;
}
