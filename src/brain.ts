import OpenAI from "openai";
import { config } from "./config.js";
import { characterSheet, modeRules } from "./character.js";

const client = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
});

export type Turn = { author: string; content: string };
export type Mode = "rp" | "hrp";

export async function reply(
  history: Turn[],
  mode: Mode = "rp",
  context = "Position actuelle : la forêt du Palier 1.",
): Promise<string> {
  const recent = history.slice(-config.historyLimit);

  const completion = await client.chat.completions.create({
    model: config.model,
    temperature: 0.9,
    max_tokens: mode === "rp" ? 400 : 120,
    messages: [
      {
        role: "system",
        content: `${characterSheet}\n${context}\n${modeRules[mode]}`,
      },
      ...recent.map(
        (t) =>
        t.author === "Mutoke"
          ? { role: "assistant" as const, content: t.content }
          : { role: "user" as const, content: `${t.author} : ${t.content}` },
      ),
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";

  if (mode === "hrp") {
    const match = text.match(/\([^()]+\)/g);
    return match ? match[match.length - 1] : "";
  }

  return text;
}