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

  return (
    <div class="flex flex-col h-full">
      {/* 新建聊天按钮 - 固定高度 */}
      <div class="flex-none p-4 border-b border-gray-700">
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5
                 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                 transition-colors duration-200 font-medium"
          onClick={async () => {
            const head = await fetchOrError<ChatHead>(
              `/api/workspace/${state.id}/chat`,
              {
                method: "POST",
                body: {},
              },
            );
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
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>新建聊天</span>
        </button>
      </div>

      {/* 聊天列表 - 自动填充剩余空间 */}
      <div class="flex-1 overflow-y-auto">
        <div class="p-2 space-y-0.5">
          {[...state.heads.value.values()].reverse().map((head) => (
            <div
              key={head.id}
              class={`group flex items-start p-3 rounded-lg cursor-pointer
                     ${head.id === currentHead 
                       ? "bg-gray-700 text-white" 
                       : "text-gray-300 hover:bg-gray-700/50"}`}
              onClick={() => {
                location.hash = `#${head.id}`;
              }}
            >
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center">
                  <h3 class="text-sm font-medium truncate">
                    {head.title}
                  </h3>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("确定要删除这个对话吗？")) return;
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
                    class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 
                           rounded transition-all duration-200"
                  >
                    <svg class="w-4 h-4 text-gray-400" /* ... */ />
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-500 truncate">
                  {new Date(head.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
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
