import { useEffect, useMemo, useState } from "preact/hooks";
import {
  createWorkspaceState,
  WorkspaceInfo,
  WorkspaceStateContext,
} from "../lib/workspace.ts";
import { NewChat, SidebarContent } from "./Sidebar.tsx";
import { ChatContent } from "./ChatContent.tsx";
import { fetchOrError } from "../lib/fetch.ts";

export function ChatUI(
  { workspaceId, workspaceInfo: initialWorkspaceInfo }: {
    workspaceId: string;
    workspaceInfo: WorkspaceInfo;
  },
) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingName, setEditingName] = useState(null as string | null);
  const [workspaceInfo, setWorkspaceInfo] = useState(initialWorkspaceInfo);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const state = useMemo(
    () => createWorkspaceState(workspaceId, workspaceInfo),
    [],
  );

  useEffect(() => {
    const callback = () => {
      state.currentHead.value = location.hash.slice(1);
      setIsSidebarOpen(false);
    };
    callback();
    globalThis.addEventListener("hashchange", callback);
    return () => globalThis.removeEventListener("hashchange", callback);
  }, []);

  useEffect(() => {
    const sse = new EventSource(`/workspace/${workspaceId}`);
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.workspaceInfo) {
        setWorkspaceInfo(data.workspaceInfo);
      }
    };

    return () => sse.close();
  }, [workspaceId]);

  return (
    <WorkspaceStateContext.Provider value={state}>
      <div class="flex flex-col h-screen">
        <div class="bg-gray-800 text-white p-4 flex items-center">
          <div class="flex items-center sm:hidden">
            <button
              class="text-xl mr-4"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          </div>
          
          <div class="flex-grow">
            {editingName !== null ? (
              <input
                type="text"
                class="w-full p-2 text-black rounded"
                value={editingName}
                onChange={(e) => setEditingName((e.target as HTMLInputElement).value)}
                onBlur={async () => {
                  if (editingName.trim()) {
                    await fetchOrError(
                      `/workspace/${workspaceId}`,
                      {
                        method: "PATCH",
                        body: { name: editingName.trim() },
                      },
                    );
                  }
                  setEditingName(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                autoFocus
              />
            ) : (
              <h1
                class="text-xl font-bold cursor-pointer hover:text-gray-300"
                onClick={() => setEditingName(workspaceInfo.name || `工作区 ${workspaceId}`)}
              >
                {workspaceInfo.name || `工作区 ${workspaceId}`}
              </h1>
            )}
          </div>

          <div class="ml-4">
            <NewChat white />
          </div>

          <button
            class="ml-4 text-red-400 hover:text-red-300"
            onClick={async () => {
              const yes = confirm(
                "确定要删除这个工作区吗？此操作将删除所有对话和消息，且不可恢复。"
              );
              if (!yes) return;

              await fetch(`/workspace/${workspaceId}`, {
                method: "DELETE",
              });
              // 删除后会自动重定向到工作区列表页
            }}
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
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>

        <div class="flex flex-1 overflow-hidden">
          <div
            class={`w-64 bg-gray-200 ${
              isSidebarOpen ? "block" : "hidden"
            } sm:block`}
          >
            <SidebarContent />
          </div>
          <div class="flex-1 bg-gray-100">
            <ChatContent />
          </div>
        </div>
      </div>
    </WorkspaceStateContext.Provider>
  );
}
