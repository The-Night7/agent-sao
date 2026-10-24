import { reply, type Mode } from "./brain.js";
import { humanDelay } from "./humanize.js";
import { asksIfBot } from "./guard.js";

async function handle(author: string, content: string, mode: Mode) {
  if (asksIfBot(content)) {
    console.log("[PAUSE] Question sur la nature du joueur, alerte fondateur à brancher.");
    return;
  }
  const answer = await reply([{ author, content }], mode);
    if (!answer) {
    console.log(`[${mode}] Réponse vide, rien n'est envoyé.\n`);
    return;
  }
  await humanDelay(answer);
  console.log(`[${mode}] ${answer}\n`);
}

async function main() {
  await handle("Silence", "Silence sourit et fait signe à Mutoke de la suivre vers la clairière.", "rp");
  await handle("Anatoast", "Salut Mutoke, ça va ?", "hrp");
  await handle("Aya Natsume", "Dis, t'es un bot ?", "hrp");
}

main().catch(console.error);