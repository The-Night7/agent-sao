const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export async function humanDelay(replyText: string): Promise<void> {
  const reading = between(1500, 4500);
  const typing = replyText.length * between(45, 90);
  await sleep(reading + Math.min(typing, 12000));
}