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
      <div class="flex flex-col h-screen bg-gray-100">
        <div class="h-14 bg-gray-900 text-white px-4 flex items-center shadow-md">
          <div class="flex items-center sm:hidden">
            <button
              class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          </div>
          
          <div class="flex-grow">
            {editingName !== null ? (
              <input
                type="text"
                class="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <h1 class="text-xl font-semibold hover:text-gray-300 cursor-pointer">
                {workspaceInfo.name || `工作区 ${workspaceId}`}
              </h1>
            )}
          </div>

          <a
            href="/workspace"
            class="ml-4 p-2 text-gray-300 hover:text-white hover:bg-gray-800 
                   rounded-lg transition-colors"
            title="返回工作区列表"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </a>
        </div>

        <div class="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
          <div class={`w-72 bg-gray-800 flex flex-col ${
            isSidebarOpen ? "block" : "hidden"
          } sm:block`}>
            <SidebarContent />
          </div>
          <div class="flex-1 bg-gray-100 flex flex-col">
            <ChatContent />
          </div>
        </div>
      </div>
    </WorkspaceStateContext.Provider>
  );
}
