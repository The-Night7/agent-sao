import OpenAI from "openai";
import { config } from "./config.js";
import { characterSheet, modeRules } from "./character.js";

const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
const MODEL = "mistral-large-latest";

async function once(system: string): Promise<boolean> {
  try {
    await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Silence : Silence fait signe à Mutoke de la suivre." },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

async function test(label: string, system: string) {
  const a = await once(system);
  const b = await once(system);
  const tag = (ok: boolean) => (ok ? "OK" : "KO");
  console.log(`${tag(a)}/${tag(b)}  ${label}`);
}

const wrap = (sheet: string) =>
  `${sheet}\nPosition actuelle : la forêt du Palier 1.\n${modeRules.rp}`;

async function main() {
  await test("TÉMOIN minimal", "Tu es Mutoke, un joueur de RP Sword Art Online. Écris en français, à la 3e personne, au présent.");
  await test("fiche complète", wrap(characterSheet));

  const lines = characterSheet.split("\n");
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    const without = lines.filter((_, j) => j !== i).join("\n");
    await test(`sans : ${line.trim().slice(0, 55)}`, wrap(without));
  }
}

main().catch(console.error);