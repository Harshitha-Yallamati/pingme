import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const loadLocalEnv = () => {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
};

loadLocalEnv();

const { default: app } = await import("./app.js");
const port = Number(process.env.AI_SERVER_PORT || process.env.PORT || 8787);

app.listen(port, () => {
  console.log(`[AI] Gemini assistant API listening on http://localhost:${port}`);
});
