import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import {
  ChatHead,
  ChatMessage,
  WorkspaceStateContext,
} from "../lib/workspace.ts";
import { fetchOrError } from "../lib/fetch.ts";

export function ChatContent() {
  const state = useContext(WorkspaceStateContext)!;
  const currentHead = state.currentHead.value;
  
  if (!currentHead) {
    return (
      <div class="flex flex-col p-4 text-center text-gray-600">
        Select a chat
      </div>
    );
  }
  
  return (
    <div class="flex flex-col h-full">
      <ChatContentForId key={currentHead} chatId={currentHead} />
    </div>
  );
}

function ChatContentForId({ chatId }: { chatId: string }) {
  const state = useContext(WorkspaceStateContext)!;
  const [head, setHead] = useState<ChatHead | null>(null);
  const [loading, setLoading] = useState(true);
  const messageCache = useRef(new Map<string, ChatMessage>());
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const boundaryCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [availableBackends, setAvailableBackends] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingSystemPrompt, setEditingSystemPrompt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const backendSelector = useRef<HTMLSelectElement | null>(null);

  // 使用 useEffect 监听聊天内容更新
  useEffect(() => {
    const sse = new EventSource(`/api/workspace/${state.id}/chats/${chatId}`);
    sse.onmessage = (event) => {
      const body = JSON.parse(event.data);
      for (const m of body.messages) {
        messageCache.current.set(m.id, m);
      }
      if (!body.head.backend) {
        body.head.backend = availableBackends[0];
      }
      setHead(body.head);
      setAvailableBackends(body.availableBackends);
      setLoading(false);
    };
    return () => sse.close();
  }, [state.id, chatId]);

  // 使用 useEffect 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [head?.messages ? head.messages[head.messages.length - 1] : ""]);

  // 使用 useMemo 缓存消息列表
  const messageList = useMemo(() => {
    if (!head?.messages) return null;
    return head.messages.map((id, i) => {
      if (!id) {
        return (
          <div class="text-gray-400 border-gray-400 text-sm border-b">
            New conversation
          </div>
        );
      }
      const message = messageCache.current.get(id);
      if (!message) return null;
      return (
        <MessageView
          key={id}
          chatId={head.id}
          message={message}
          forceCompleted={i !== head.messages!.length - 1}
        />
      );
    });
  }, [head?.messages, messageCache.current]);

  // 使用 useCallback 优化发送消息函数
  const handleSend = useCallback(async () => {
    const content = inputRef.current?.value?.trim();
    if (!content) return;

    await fetchOrError(
      `/api/workspace/${state.id}/chats/${chatId}`,
      {
        method: "POST",
        body: {
          text: content,
          boundary: !!boundaryCheckboxRef.current?.checked,
        },
      },
    );

    if (inputRef.current) inputRef.current.value = "";
    if (boundaryCheckboxRef.current) {
      boundaryCheckboxRef.current.checked = false;
    }
  }, [state.id, chatId]);

  if (loading) {
    return <div class="p-4">Loading...</div>;
  }

  if (!head) return null;

  return (
    <div class="flex flex-col h-full">
      {/* 聊天头部 */}
      <div class="flex-none p-4 bg-white border-b border-gray-200">
        <div class="flex flex-col items-start mb-4">
          {/* 标题部分 */}
          <div class="font-bold text-lg">
            {editingTitle !== null ? (
              <input
                type="text"
                class="p-2 border border-gray-300 rounded"
                value={editingTitle}
                onChange={(e) => setEditingTitle((e.target as HTMLInputElement).value)}
                onBlur={async () => {
                  await fetchOrError(
                    `/api/workspace/${state.id}/chats/${chatId}`,
                    {
                      method: "PATCH",
                      body: { title: editingTitle },
                    },
                  );
                  setEditingTitle(null);
                }}
              />
            ) : (
              <span
                class="cursor-pointer"
                onClick={() => setEditingTitle(head.title)}
              >
                {head.title}
              </span>
            )}
          </div>

          {/* 时间戳和模型选择 */}
          <div class="flex flex-row items-center gap-4">
            <div class="text-sm text-gray-400">
              {new Date(head.timestamp).toLocaleString()}
            </div>

            <div class="text-sm">
              <select
                class="bg-gray-50 disabled:bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                ref={backendSelector}
                value={head.backend}
                onChange={async (e) => {
                  const newBackend = (e.target as HTMLSelectElement).value;
                  if (backendSelector.current) {
                    backendSelector.current.disabled = true;
                  }
                  await fetchOrError(
                    `/api/workspace/${state.id}/chats/${chatId}`,
                    {
                      method: "PATCH",
                      body: { backend: newBackend },
                    },
                  );
                  if (backendSelector.current) {
                    backendSelector.current.disabled = false;
                  }
                }}
              >
                {availableBackends.map((b) => <option value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* 系统提示 */}
          <div class="text-sm text-gray-500 w-full">
            {editingSystemPrompt !== null ? (
              <input
                type="text"
                class="p-2 border border-gray-300 rounded w-full"
                value={editingSystemPrompt}
                onChange={(e) => setEditingSystemPrompt((e.target as HTMLInputElement).value)}
                onBlur={async () => {
                  await fetchOrError(
                    `/api/workspace/${state.id}/chats/${chatId}`,
                    {
                      method: "PATCH",
                      body: { systemPrompt: editingSystemPrompt },
                    },
                  );
                  setEditingSystemPrompt(null);
                }}
              />
            ) : (
              <span
                class="cursor-pointer"
                onClick={() => setEditingSystemPrompt(head.systemPrompt)}
              >
                {head.systemPrompt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 - 自动填充剩余空间 */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messageList}
        <div ref={bottomRef}></div>
      </div>

      {/* 输入区域 - 固定高度 */}
      <div class="flex-none p-4 border-t border-gray-200 bg-white">
        <div class="flex gap-3">
          <textarea
            ref={inputRef}
            class="flex-1 min-h-[2.5rem] max-h-32 p-3 bg-gray-50 border border-gray-200 
                   rounded-lg resize-none focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent transition-all"
            placeholder="输入消息..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium 
                   rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 
                   focus:ring-offset-2 disabled:opacity-50"
          >
            发送
          </button>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            ref={boundaryCheckboxRef}
            class="rounded border-gray-300 text-blue-600 
                   focus:ring-blue-500 cursor-pointer"
          />
          <label class="text-sm text-gray-600 cursor-pointer">
            开始新对话
          </label>
        </div>
      </div>
    </div>
  );
}

function MessageView({ chatId, message, forceCompleted }: MessageViewProps) {
  return (
    <div class={`flex flex-col rounded-lg p-4 ${
      message.role === "assistant" 
        ? "bg-gray-100 border border-gray-200" 
        : "bg-blue-50 border border-blue-100"
    }`}>
      {/* 消息头部 */}
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class={`text-sm font-medium ${
            message.role === "assistant" ? "text-gray-700" : "text-blue-700"
          }`}>
            {message.role === "assistant" ? "AI" : "你"}
            {message.backend ? ` (${message.backend})` : ""}
          </span>
          <span class="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        
        <button
          onClick={async () => {/*...*/}}
          class="text-xs text-gray-400 hover:text-red-500 
                 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
        >
          删除
        </button>
      </div>

      {/* 消息状态 */}
      {(message.interrupted && !message.completed) ||
        (!message.completed && Date.now() - message.timestamp > 30000) ? (
        <div class="text-sm text-red-500 mb-2">已中断</div>
      ) : null}

      {/* 消息内容 */}
      <div class="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: message.html ?? "" }} />
      </div>
    </div>
  );
}
