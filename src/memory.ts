import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { Turn } from "./brain.js";

export type Memory = {
  location: string;
  actions: string[];
  notes: Record<string, string>;
  history: Turn[];
};

const FILE = "data/memory.json";

const fresh = (): Memory => ({
  location: "la forêt du Palier 1",
  actions: [],
  notes: {},
  history: [],
});

export async function loadMemory(): Promise<Memory> {
  try {
    return { ...fresh(), ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch {
    return fresh();
  }
}

export async function saveMemory(m: Memory): Promise<void> {
  m.actions = m.actions.slice(-10);
  m.history = m.history.slice(-60);
  await mkdir("data", { recursive: true });
  await writeFile(FILE, JSON.stringify(m, null, 2), "utf8");
}

export function memoryContext(m: Memory): string {
  const parts = [`Position actuelle : ${m.location}.`];
  if (m.actions.length) {
    parts.push(
      "Actions récentes de Mutoke (de la plus ancienne à la plus récente) :\n" +
        m.actions.map((a) => `- ${a}`).join("\n"),
    );
  }
  const notes = Object.entries(m.notes);
  if (notes.length) {
    parts.push(
      "Ce que Mutoke sait des autres personnages :\n" +
        notes.map(([name, n]) => `- ${name} : ${n}`).join("\n"),
    );
  }
  parts.push("Reste cohérent avec ces informations et n'en invente pas d'autres.");
  return parts.join("\n");
}