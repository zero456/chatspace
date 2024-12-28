import { FreshContext, Handlers } from "$fresh/server.ts";
import { ChatUI } from "../../islands/ChatUI.tsx";
import { kv } from "../../lib/kv.ts";
import { ChatHead, WorkspaceInfo } from "../../lib/workspace.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const info = await kv.get<WorkspaceInfo>([
      "workspaces",
      ctx.params.workspaceId,
    ]);
    if (!info.value) return ctx.renderNotFound();

    const heads = await Array.fromAsync(
      kv.list<ChatHead>({ prefix: ["heads", ctx.params.workspaceId] }),
    );
    info.value.heads = heads.map((x) => {
      delete x.value.messages;
      return x.value;
    });

    if (req.headers.get("accept") === "text/event-stream") {
      const key = ["workspaces", ctx.params.workspaceId];
      const encoder = new TextEncoder();
      const stream = new TransformStream({
        transform: async (_, controller) => {
          const workspaceInfo = (await kv.get<WorkspaceInfo>(key)).value;
          if (workspaceInfo) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ workspaceInfo })}\n\n`),
            );
          }
        },
      });

      kv.watch([key]).pipeTo(stream.writable).catch((e) => {
        if (e + "" === "resource closed") return;
        console.error(`Error watching workspace: ${e}`);
      });

      return new Response(stream.readable, {
        headers: {
          "content-type": "text/event-stream",
        },
      });
    }

    return ctx.render({
      workspaceId: ctx.params.workspaceId,
      workspaceInfo: info.value,
    });
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const { name } = await req.json();
    if (typeof name !== "string" || name.length === 0) {
      return Response.json({ error: "invalid name" }, { status: 400 });
    }

    const key = ["workspaces", ctx.params.workspaceId];
    const info = await kv.get<WorkspaceInfo>(key);
    if (!info.value) return ctx.renderNotFound();

    info.value.name = name;
    const { ok } = await kv.atomic().check(info).set(key, info.value).commit();
    if (!ok) return Response.json({ error: "conflict" }, { status: 409 });

    return Response.json({ ok: true });
  },

  async DELETE(req: Request, ctx: FreshContext) {
    const workspaceId = ctx.params.workspaceId;
    
    // 获取工作区信息
    const info = await kv.get<WorkspaceInfo>([
      "workspaces",
      workspaceId,
    ]);
    if (!info.value) return ctx.renderNotFound();

    // 获取所有对话头
    const heads = await Array.fromAsync(
      kv.list<ChatHead>({ prefix: ["heads", workspaceId] }),
    );

    // 创建原子操作
    const atomic = kv.atomic();

    // 删除工作区信息
    atomic.delete(["workspaces", workspaceId]);

    // 删除所有对话头和消息
    for (const head of heads) {
      atomic.delete(head.key);
      
      // 删除对话中的所有消息
      if (head.value.messages) {
        for (const messageId of head.value.messages) {
          if (messageId) { // 跳过空字符串（用作分隔符）
            atomic.delete([
              "messages",
              workspaceId,
              messageId,
            ]);
          }
        }
      }
    }

    // 执行原子操作
    const { ok } = await atomic.commit();
    if (!ok) {
      return Response.json({ error: "conflict" }, { status: 409 });
    }

    // 删除成功后重定向到工作区列表页
    return new Response(null, {
      status: 303,
      headers: { Location: "/workspace" },
    });
  },
};

export default function Workspace(
  { data }: {
    data: { workspaceId: string; workspaceInfo: WorkspaceInfo };
  },
) {
  return (
    <div>
      <ChatUI
        workspaceId={data.workspaceId}
        workspaceInfo={data.workspaceInfo}
      />
    </div>
  );
}
