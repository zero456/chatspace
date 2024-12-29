import * as ammonia from "ammonia";
import { marked } from "npm:marked@11.1.0";

const ammoniaInit = ammonia.init();

export async function safelyRenderMarkdown(input: string): Promise<string> {
  await ammoniaInit;
  return ammonia.clean(await marked(input));
}
