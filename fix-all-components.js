import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const files = glob.sync("src/lib/components/ui/*.svelte");

files.forEach((file) => {
  let content = readFileSync(file, "utf8");

  // Fix any remaining 'class' references in templates
  content = content.replace(/, class\)/g, ", className)");
  content = content.replace(/\bclass\b(?=\s*\))/g, "className");

  writeFileSync(file, content);
});

console.log("Fixed all component issues in", files.length, "files");
