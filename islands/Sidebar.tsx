import { useContext, useEffect } from "preact/hooks";
import { fetchOrError } from "../lib/fetch.ts";
import {
  ChatHead,
  WorkspaceInfo,
  WorkspaceStateContext,
} from "../lib/workspace.ts";

// A list of conversation titles. Clicking on one will open it in the content
// area.
export function SidebarContent() {
  const state = useContext(WorkspaceStateContext)!;
  const currentHead = state.currentHead.value;

  // 添加 SSE 监听
  useEffect(() => {
    const headListeners = new Map<string, EventSource>();

    // 为每个对话头创建 SSE 监听
    for (const head of state.heads.value.values()) {
      const sse = new EventSource(
        `/api/workspace/${state.id}/chats/${head.id}`,
      );

      sse.onmessage = (event) => {
        const body: { head: ChatHead } = JSON.parse(event.data);
        if (body.head) {
          // 更新对话头
          state.heads.value = new Map(state.heads.value);
          state.heads.value.set(body.head.id, body.head);
        }
      };

      headListeners.set(head.id, sse);
    }

    // 清理函数
    return () => {
      for (const sse of headListeners.values()) {
        sse.close();
      }
    };
  }, [state.heads.value.size]); // 当对话数量变化时重新设置监听

  return (
    <div class="flex flex-col h-full">
      <div class="p-2 hidden sm:block">
        <NewChat />
      </div>

      <div class="flex flex-col overflow-y-auto">
        {[...state.heads.value.values()].reverse().map((head) => (
          <div
            key={head.id}
            class={`flex flex-col p-2 border-b border-gray-200 hover:bg-gray-400${
              head.id === currentHead ? " bg-gray-300" : ""
            }`}
            onClick={() => {
              location.hash = `#${head.id}`;
            }}
          >
            <div class="font-bold">{head.title}</div>
            <div class="flex flex-row gap-2">
              <div class="text-gray-500">
                {new Date(head.timestamp).toLocaleDateString()}
              </div>
              <button
                onClick={async () => {
                  const yes = confirm(
                    "Are you sure you want to delete this chat?",
                  );
                  if (!yes) return;

                  await fetchOrError(
                    `/api/workspace/${state.id}/chats/${head.id}`,
                    {
                      method: "DELETE",
                    },
                  );
                  state.heads.value = new Map(state.heads.value);
                  state.heads.value.delete(head.id);
                  location.hash = "";
                }}
                class="underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewChat({ white }: { white?: boolean }) {
  const state = useContext(WorkspaceStateContext)!;
  return (
    <button
      class={`flex flex-row ${
        white ? "bg-white" : "bg-black"
      } rounded-lg shadow text-${white ? "black" : "white"} py-2 px-4 gap-2`}
      onClick={async () => {
        const head = await fetchOrError<ChatHead>(
          `/api/workspace/${state.id}/chat`,
          {
            method: "POST",
            body: {},
          },
        );
        state.heads.value = new Map(state.heads.value);
        state.heads.value.set(head.id, head);
        location.hash = `#${head.id}`;
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        data-slot="icon"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>

      <span>New chat</span>
    </button>
  );
}
