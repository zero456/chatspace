import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies, setCookie } from "$std/http/cookie.ts";

interface LoginData {
  error?: string;
  savedPassword?: string;
}

export const handler: Handlers<LoginData> = {
  GET(req, ctx) {
    const cookies = getCookies(req.headers);
    const savedPassword = cookies.password;
    return ctx.render({ savedPassword });
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const password = form.get("password")?.toString();
    const correctPassword = Deno.env.get("CHATSPACE_PASSWORD");

    if (!correctPassword) {
      return ctx.render({ error: "系统未设置密码" });
    }

    if (password !== correctPassword) {
      return ctx.render({ error: "密码错误" });
    }

    const headers = new Headers();
    headers.set("location", "/");

    // 设置cookie，有效期1天
    setCookie(headers, {
      name: "password",
      value: password,
      maxAge: 86400,
      path: "/",
    });

    return new Response(null, {
      status: 303,
      headers,
    });
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 class="text-2xl font-bold mb-6 text-center">登录 Chatspace</h1>
        <form method="POST">
          {data.error && (
            <div class="mb-4 text-red-500 text-center">
              {data.error}
            </div>
          )}
          <div class="mb-4">
            <input
              type="password"
              name="password"
              value={data.savedPassword}
              placeholder="请输入密码"
              class="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
} 