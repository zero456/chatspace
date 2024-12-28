import { FreshContext, Handlers } from "$fresh/server.ts";
import { ulid } from "ulid";
import { kv } from "../../../../lib/kv.ts";
import { ChatHead, WorkspaceInfo } from "../../../../lib/workspace.ts";

export const handler: Handlers = {
  async POST(_req: Request, ctx: FreshContext) {
    // create a new conversation
    const info = await kv.get<WorkspaceInfo>([
      "workspaces",
      ctx.params.workspaceId,
    ]);
    if (!info.value) return ctx.renderNotFound();

    const head: ChatHead = {
      id: ulid(),
      title: "对话名称（可单击修改）",
      systemPrompt: "你是一位博学的专家，用中文给出简洁而有用的答案。",
      timestamp: Date.now(),
    };
    await kv.set(["heads", ctx.params.workspaceId, head.id], head);

    return Response.json(head, { status: 201 });
  },
};
