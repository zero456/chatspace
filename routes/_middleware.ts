import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const cookies = getCookies(req.headers);
  const correctPassword = Deno.env.get("CHATSPACE_PASSWORD");
  const url = new URL(req.url);
  const pathname = url.pathname;

  // 如果系统未设置密码，则不需要验证
  if (!correctPassword) {
    return await ctx.next();
  }

  // 白名单路径不需要验证
  const whitelist = [
    "/login",
    "/styles.css",
    "/logo.svg",
    "/favicon.ico",
  ];
  if (whitelist.some(path => pathname.startsWith(path))) {
    return await ctx.next();
  }

  // 验证cookie中的密码
  const storedPassword = cookies.password;
  if (!storedPassword || storedPassword !== correctPassword) {
    // 保存原始请求的 URL，以便登录后重定向回来
    const returnUrl = encodeURIComponent(pathname + url.search + url.hash);
    return new Response(null, {
      status: 302,
      headers: { 
        Location: `/login?return=${returnUrl}`,
      },
    });
  }

  // API 路由验证通过后可以访问
  if (pathname.startsWith("/api/")) {
    return await ctx.next();
  }

  return await ctx.next();
} 