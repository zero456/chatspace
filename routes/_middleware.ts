import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const cookies = getCookies(req.headers);
  const correctPassword = Deno.env.get("CHATSPACE_PASSWORD");
  const url = new URL(req.url);

  // 如果系统未设置密码，则不需要验证
  if (!correctPassword) {
    return await ctx.next();
  }

  // 登录页面不需要验证
  if (url.pathname === "/login") {
    return await ctx.next();
  }

  // API 路由不需要验证（可选，取决于您的安全需求）
  if (url.pathname.startsWith("/api/")) {
    return await ctx.next();
  }

  // 验证cookie中的密码
  if (cookies.password !== correctPassword) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  return await ctx.next();
} 