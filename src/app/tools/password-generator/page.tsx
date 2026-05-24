
import PasswordGeneratorTool from "./password-generator-tool";
import { ToolDetailHeader } from "@/components/tool-detail-header";
import { Key } from "lucide-react";

export default function PasswordGeneratorPage() {

  return (
    <div>
      <ToolDetailHeader
        title="Password Generator"
        description="Generate secure random passwords with customizable options."
        icon={Key}
      />
      <PasswordGeneratorTool />
    </div>
  );
}
