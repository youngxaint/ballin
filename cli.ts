import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Enzo, EnzoError } from "./enzo.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const enzo = new Enzo({ apiKey });
const rl = readline.createInterface({ input, output });
const SESSION = "cli";

console.log("Enzo: your AI health assistant. Type /reset to start over, /exit to quit.");
console.log("I share general health information and am not a substitute for a doctor.\n");

try {
  while (true) {
    const line = (await rl.question("You: ")).trim();
    if (!line) continue;
    if (line === "/exit") break;
    if (line === "/reset") {
      enzo.reset(SESSION);
      console.log("Enzo: Fresh start. What's on your mind?\n");
      continue;
    }

    process.stdout.write("Enzo: ");
    try {
      for await (const piece of enzo.chatStream(SESSION, line)) {
        process.stdout.write(piece);
      }
      process.stdout.write("\n\n");
    } catch (err) {
      const msg = err instanceof EnzoError ? err.message : "Unexpected error.";
      console.error(`\n[${msg}]\n`);
    }
  }
} finally {
  rl.close();
}
