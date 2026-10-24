import { OpenAI } from "openai";
import { config } from "./config.js";

const client = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
});

async function main() {
  const list = await client.models.list();
  for (const m of list.data) {
    console.log(m.id);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});