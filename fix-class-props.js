import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const files = glob.sync("src/lib/components/ui/*.svelte");

files.forEach((file) => {
  let content = readFileSync(file, "utf8");

  // Replace 'class' with 'className' in export statements
  content = content.replace(
    /export let class: string = '';/,
    "export let className: string = '';"
  );

  // Replace 'class' with 'className' in template expressions
  content = content.replace(/class=\{cn\([^}]+,\s*class\)\}/g, (match) => {
    return match.replace(/, class\)/, ", className)");
  });

  writeFileSync(file, content);
});

console.log("Fixed class props in", files.length, "files");
