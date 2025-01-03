// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_workspace_workspaceId_chat from "./routes/api/workspace/[workspaceId]/chat.ts";
import * as $api_workspace_workspaceId_chats_chatId_ from "./routes/api/workspace/[workspaceId]/chats/[chatId].ts";
import * as $api_workspace_workspaceId_messages_messageId_ from "./routes/api/workspace/[workspaceId]/messages/[messageId].ts";
import * as $index from "./routes/index.tsx";
import * as $login from "./routes/login.tsx";
import * as $workspace_workspaceId_ from "./routes/workspace/[workspaceId].tsx";
import * as $workspace_index from "./routes/workspace/index.tsx";
import * as $ChatContent from "./islands/ChatContent.tsx";
import * as $ChatUI from "./islands/ChatUI.tsx";
import * as $Sidebar from "./islands/Sidebar.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/workspace/[workspaceId]/chat.ts":
      $api_workspace_workspaceId_chat,
    "./routes/api/workspace/[workspaceId]/chats/[chatId].ts":
      $api_workspace_workspaceId_chats_chatId_,
    "./routes/api/workspace/[workspaceId]/messages/[messageId].ts":
      $api_workspace_workspaceId_messages_messageId_,
    "./routes/index.tsx": $index,
    "./routes/login.tsx": $login,
    "./routes/workspace/[workspaceId].tsx": $workspace_workspaceId_,
    "./routes/workspace/index.tsx": $workspace_index,
  },
  islands: {
    "./islands/ChatContent.tsx": $ChatContent,
    "./islands/ChatUI.tsx": $ChatUI,
    "./islands/Sidebar.tsx": $Sidebar,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
