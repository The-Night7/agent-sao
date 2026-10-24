import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable manquante dans le .env : ${name}`);
  }
  return value;
}

export const config = {
  apiKey: required("ONEMIN_API_KEY"),
  baseUrl: required("ONEMIN_BASE_URL"),
  model: process.env.ONEMIN_MODEL ?? "claude-sonnet-5-5",
  historyLimit: 20,
};