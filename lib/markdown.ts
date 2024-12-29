import * as ammonia from "ammonia";
import { marked } from "marked";

const ammoniaInit = ammonia.init();

export async function safelyRenderMarkdown(input: string): Promise<string> {
  await ammoniaInit;
  return ammonia.clean(await marked(input));
}
