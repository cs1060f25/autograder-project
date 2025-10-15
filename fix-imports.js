import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const files = glob.sync("src/**/*.svelte");

const componentMap = {
  Button: "button.svelte",
  Card: "card.svelte",
  CardContent: "card-content.svelte",
  CardDescription: "card-description.svelte",
  CardHeader: "card-header.svelte",
  CardTitle: "card-title.svelte",
  Input: "input.svelte",
  Label: "label.svelte",
  Alert: "alert.svelte",
  Dialog: "dialog.svelte",
  DialogContent: "dialog-content.svelte",
  DialogDescription: "dialog-description.svelte",
  DialogFooter: "dialog-footer.svelte",
  DialogHeader: "dialog-header.svelte",
  DialogTitle: "dialog-title.svelte",
};

files.forEach((file) => {
  let content = readFileSync(file, "utf8");

  // Fix individual component imports
  Object.entries(componentMap).forEach(([component, filename]) => {
    const importPattern = new RegExp(
      `import\\s*{\\s*${component}\\s*}\\s*from\\s*['"]\\$lib/components/ui/${component}['"];?`,
      "g"
    );
    const replacement = `import ${component} from '$lib/components/ui/${filename}';`;
    content = content.replace(importPattern, replacement);
  });

  // Fix destructured imports
  const destructuredPattern =
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]\$lib\/components\/ui\/([^'"]+)['"];?/g;
  content = content.replace(destructuredPattern, (match, components, path) => {
    const componentList = components.split(",").map((c) => c.trim());
    return componentList
      .map((component) => {
        const filename =
          componentMap[component] || `${component.toLowerCase()}.svelte`;
        return `import ${component} from '$lib/components/ui/${filename}';`;
      })
      .join("\n");
  });

  writeFileSync(file, content);
});

console.log("Fixed imports in", files.length, "files");
