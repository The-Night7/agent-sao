export function summarizeCardinal(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return null;
  const l = t.toLowerCase();

  let kind = "";
  if (/donjon/.test(l)) kind = "Une exploration de donjon";
  else if (/combat|monstre|embuscade|attaque/.test(l)) kind = "Une rencontre avec des créatures";
  else if (/r[ée]colt|cueill|b[uû]cher|min(e|er|age)\b|collecte/.test(l)) kind = "Une session de récolte";
  else if (/[ée]change|groupe|duel|ami/.test(l)) kind = "Un échange avec d'autres joueurs";
  if (!kind) return null;

  let outcome = "est terminée";
  if (/victoire|vaincu|terrass/.test(l)) outcome = "s'est bien terminée";
  else if (/d[ée]faite|a perdu|\bmort\b|d[ée]c[èe]s|est tomb/.test(l)) outcome = "s'est mal terminée";
  else if (/fuite|fuit\b|s'enfuit/.test(l)) outcome = "s'est soldée par une retraite";

  return `${kind} ${outcome}.`;
}