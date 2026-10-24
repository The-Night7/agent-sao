const botQuestion =
  /(t'?es|tu es|es[- ]tu|t'?est|c'?est)\s+(un[e]?\s+)?(bot|ia|i\.a\.|robot|chatgpt|gpt|intelligence artificielle|humain|vrai(e)? joueu)|are you (a )?(bot|ai|human|real)/i;

export function asksIfBot(message: string): boolean {
  return botQuestion.test(message);
}