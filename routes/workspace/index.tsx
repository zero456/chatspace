import { FreshContext, Handlers } from "$fresh/server.ts";
import { kv } from "../../lib/kv.ts";
import { WorkspaceInfo } from "../../lib/workspace.ts";
import { ulid } from "ulid";

interface WorkspaceListData {
  workspaces: Array<{
    id: string;
    info: WorkspaceInfo;
  }>;
}

export const handler: Handlers<WorkspaceListData> = {
  async GET(_req: Request, ctx: FreshContext) {
    // 获取所有工作区
    const workspaces = await Array.fromAsync(
      kv.list<WorkspaceInfo>({ prefix: ["workspaces"] })
    );

    return ctx.render({
      workspaces: workspaces.map((entry) => ({
        id: entry.key[1] as string,
        info: entry.value,
      })),
    });
  },

  async POST(req: Request, ctx: FreshContext) {
    const workspaceId = ulid();
    const info: WorkspaceInfo = {
      heads: [],
      createdAt: Date.now(),
    };
    await kv.set([
      "workspaces",
      workspaceId,
    ], info);

    return Response.redirect(
      new URL(req.url).origin + `/workspace/${workspaceId}`,
      302,
    );
  },
};

export default function WorkspaceInit({ data }: { data: WorkspaceListData }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `
          async function deleteWorkspace(id) {
            if (!confirm("确定要删除这个工作区吗？此操作不可恢复。")) {
              return;
            }

            try {
              const response = await fetch('/workspace/' + id, {
                method: 'DELETE'
              });
              
              if (!response.ok) {
                const text = await response.text();
                throw new Error(text || '删除失败');
              }

              window.location.reload();
            } catch (error) {
              alert('删除失败: ' + error);
            }
          }
        `
      }} />

      <div class="p-4">
        <div class="mb-8">
          <form method="POST">
            <button
              class="flex flex-row bg-gray-200 rounded-lg shadow text-black py-2 px-4 gap-2"
              type="submit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span>新建工作区</span>
            </button>
          </form>
        </div>

        <div class="space-y-4">
          {data.workspaces.map((workspace) => (
            <div
              key={workspace.id}
              data-workspace-id={workspace.id}
              class="flex items-center justify-between bg-white p-4 rounded-lg shadow"
            >
              <a
                href={`/workspace/${workspace.id}`}
                class="flex-grow hover:text-blue-600"
              >
                <div class="font-bold">
                  {workspace.info.name || `工作区 ${workspace.id}`}
                </div>
                <div class="text-sm text-gray-500">
                  创建于 {new Date(workspace.info.createdAt).toLocaleString()}
                </div>
              </a>
              <button
                class="text-red-500 hover:text-red-700 p-2"
                title="删除工作区"
                aria-label="删除工作区"
                type="button"
                onclick={`deleteWorkspace('${workspace.id}')`}
              >
                <span class="sr-only">删除工作区</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
