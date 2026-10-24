import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { reply, type Mode } from "./brain.js";
import { asksIfBot } from "./guard.js";
import { summarizeCardinal } from "./cardinal.js";
import { loadMemory, saveMemory, memoryContext, type Memory } from "./memory.js";

const HELP = `
Message seul : « Auteur: texte » (préfixe « hrp> » pour une réponse hors RP)
Lignes « Cardinal: ... » : résumées dans la mémoire, sans brouillon.
Commandes :
  /lot [hrp]             colle plusieurs messages (un par ligne), puis /fin : une seule réponse à la fin
  /lieu <endroit>        Mutoke change de lieu
  /fait <action>         note une action à la main
  /note Nom: <texte>     ce que Mutoke sait d'un joueur
  /annule                supprime le dernier échange
  /etat                  affiche la mémoire
  /oubli                 efface échanges et actions (garde les notes)
`;

function parseLine(line: string): { author: string; content: string } {
  const m = line.match(/^([^:.!?]{1,40}):\s*(.+)$/);
  return m ? { author: m[1].trim(), content: m[2].trim() } : { author: "Joueur", content: line };
}

function ingest(mem: Memory, author: string, content: string) {
  mem.history.push({ author, content });
  if (author.toLowerCase() === "cardinal") {
    const summary = summarizeCardinal(content);
    if (summary && mem.actions[mem.actions.length - 1] !== summary) mem.actions.push(summary);
    return { cardinal: true, alert: false, note: summary };
  }
  return { cardinal: false, alert: asksIfBot(content), note: null };
}

async function draftReply(mem: Memory, mode: Mode) {
  const levels = [
    { label: "contexte complet", m: mem },
    { label: "sans les actions", m: { ...mem, actions: [] } },
    { label: "6 derniers messages", m: { ...mem, actions: [], history: mem.history.slice(-6) } },
    { label: "3 derniers messages", m: { ...mem, actions: [], notes: {}, history: mem.history.slice(-3) } },
  ];

  for (const { label, m } of levels) {
    try {
      const d = await reply(m.history, mode, memoryContext(m));
      if (!d) {
        console.log("\n[Brouillon vide, réessaie]\n");
        return;
      }
      mem.history.push({ author: "Mutoke", content: d });
      await saveMemory(mem);
      if (label !== "contexte complet") console.log(`(passé avec : ${label})`);
      console.log(`\n${d}\n`);
      return;
    } catch (err: any) {
      if (err.code !== "content_policy_violation") {
        console.log(`\n[Erreur] ${err.message ?? err}\n`);
        return;
      }
      console.log(`[filtre] bloqué avec « ${label} », je réduis le contexte...`);
    }
  }
  console.log("\n[filtre] tout est bloqué, même avec 3 messages. Tape /oubli puis réessaie.\n");
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const queue: string[] = [];
  let waiter: ((l: string) => void) | null = null;
  rl.on("line", (l) => {
    if (waiter) {
      const w = waiter;
      waiter = null;
      w(l);
    } else {
      queue.push(l);
    }
  });
  rl.on("close", () => process.exit(0));
  const next = (prompt: string) =>
    new Promise<string>((resolve) => {
      output.write(prompt);
      const q = queue.shift();
      if (q !== undefined) resolve(q);
      else waiter = resolve;
    });
  const mem = await loadMemory();
  console.log(HELP);

  while (true) {
    let line = (await next("> ")).trim();
    if (!line) continue;

    if (line.startsWith("/")) {
      const [cmd, ...rest] = line.split(" ");
      const arg = rest.join(" ").trim();

      if (cmd === "/lot") {
        const mode: Mode = arg === "hrp" ? "hrp" : "rp";
        console.log("Colle les messages, un par ligne (« Auteur: texte »), puis tape /fin.");
        let alertFrom: string | null = null;
        let count = 0;
        while (true) {
          const l = (await next("")).trim();
          if (l === "/fin") break;
          if (!l) continue;
          const { author, content } = parseLine(l);
          const r = ingest(mem, author, content);
          count++;
          if (r.alert) alertFrom = author;
          if (r.note) console.log(`  [Cardinal] ${r.note}`);
        }
        await saveMemory(mem);
        console.log(`${count} message(s) lu(s).`);
        if (alertFrom) {
          console.log(`\n[ALERTE] ${alertFrom} demande si c'est un bot. Aucun brouillon généré : préviens le fondateur.\n`);
        } else if (count > 0) {
          await draftReply(mem, mode);
        }
        continue;
      }

      if (cmd === "/lieu" && arg) {
        mem.location = arg;
        console.log(`Position : ${arg}\n`);
      } else if (cmd === "/fait" && arg) {
        mem.actions.push(arg);
        console.log("Action notée.\n");
      } else if (cmd === "/note" && arg.includes(":")) {
        const i = arg.indexOf(":");
        mem.notes[arg.slice(0, i).trim()] = arg.slice(i + 1).trim();
        console.log("Note enregistrée.\n");
      } else if (cmd === "/annule") {
        mem.history.splice(-2);
        console.log("Dernier échange supprimé.\n");
      } else if (cmd === "/etat") {
        console.log(`\n${memoryContext(mem)}\n`);
      } else if (cmd === "/oubli") {
        mem.history = [];
        mem.actions = [];
        console.log("Échanges et actions effacés.\n");
      } else {
        console.log(HELP);
      }
      await saveMemory(mem);
      continue;
    }

    let mode: Mode = "rp";
    if (line.startsWith("hrp>")) {
      mode = "hrp";
      line = line.slice(4).trim();
    }

    const { author, content } = parseLine(line);
    const r = ingest(mem, author, content);
    await saveMemory(mem);

    if (r.cardinal) {
      console.log(`\nNoté : ${r.note ?? "(rien de reconnu)"}\n`);
      continue;
    }
    if (r.alert) {
      console.log(`\n[ALERTE] ${author} demande si c'est un bot. Aucun brouillon généré : préviens le fondateur.\n`);
      continue;
    }
    await draftReply(mem, mode);
  }
}

main().catch(console.error);