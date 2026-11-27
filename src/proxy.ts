import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/config";

/** How often a signed-in visit refreshes "last seen" (drives "Online now"). */
const PRESENCE_COOKIE = "valid_seen";
const PRESENCE_SECONDS = 5 * 60;

/** Keeps the Supabase auth session fresh and stamps presence at most every few minutes. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub && !request.cookies.has(PRESENCE_COOKIE)) {
    await supabase.rpc("touch_last_seen");
    response.cookies.set(PRESENCE_COOKIE, "1", { maxAge: PRESENCE_SECONDS, httpOnly: true, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
