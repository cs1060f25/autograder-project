const { spawn } = require("child_process");

const child = spawn("npx", ["shadcn-svelte@latest", "init"], {
  stdio: "pipe",
  cwd: process.cwd(),
});

// Send responses to prompts
setTimeout(() => {
  child.stdin.write("\n"); // Select Slate
}, 100);

setTimeout(() => {
  child.stdin.write("src/app.css\n"); // CSS file path
}, 200);

setTimeout(() => {
  child.stdin.write("$lib/components\n"); // Components alias
}, 300);

setTimeout(() => {
  child.stdin.write("$lib\n"); // Lib alias
}, 400);

setTimeout(() => {
  child.stdin.write("$lib/utils\n"); // Utils alias
}, 500);

setTimeout(() => {
  child.stdin.write("$lib/components/ui\n"); // UI alias
}, 600);

child.on("close", (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});
