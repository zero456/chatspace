import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";

interface LoginData {
  error?: string;
  savedPassword?: string;
}

export const handler: Handlers<LoginData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const cookies = getCookies(req.headers);
    const savedPassword = cookies.password;
    const returnUrl = url.searchParams.get("return") || "/";
    return ctx.render({ savedPassword, returnUrl });
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const password = form.get("password")?.toString();
    const returnUrl = form.get("return")?.toString() || "/";
    const correctPassword = Deno.env.get("CHATSPACE_PASSWORD");

    if (!correctPassword) {
      return ctx.render({ error: "系统未设置密码" });
    }

    if (password !== correctPassword) {
      return ctx.render({ error: "密码错误" });
    }

    const headers = new Headers();
    headers.set("location", decodeURIComponent(returnUrl));

    setCookie(headers, {
      name: "password",
      value: password,
      maxAge: 86400,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return new Response(null, {
      status: 303,
      headers,
    });
  },
};

export default function Login({ data }: PageProps<LoginData & { returnUrl: string }>) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 class="text-3xl font-bold mb-8 text-center text-white">登录 FChat</h1>
        <form method="POST" class="space-y-6">
          <input type="hidden" name="return" value={data.returnUrl} />
          {data.error && (
            <div class="p-4 mb-4 text-sm text-red-400 rounded-lg bg-red-900/50">
              {data.error}
            </div>
          )}
          <div>
            <input
              type="password"
              name="password"
              value={data.savedPassword}
              placeholder="请输入密码"
              class="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                     text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
                     focus:border-transparent transition-all"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white 
                   font-medium rounded-lg transition-colors duration-200 
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                   focus:ring-offset-gray-900"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
} 