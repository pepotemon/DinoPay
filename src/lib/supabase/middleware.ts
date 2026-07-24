import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRoleFromMetadata } from "@/types/auth";

const protectedPrefixes = ["/admin", "/unidad"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const role =
      getRoleFromMetadata(user.app_metadata) ??
      getRoleFromMetadata(user.user_metadata);
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/unidad/prestamos";
    return NextResponse.redirect(url);
  }

  if (user && path.startsWith("/admin")) {
    const role =
      getRoleFromMetadata(user.app_metadata) ??
      getRoleFromMetadata(user.user_metadata);
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/unidad/prestamos";
      return NextResponse.redirect(url);
    }
  }

  if (user && path.startsWith("/unidad")) {
    const role =
      getRoleFromMetadata(user.app_metadata) ??
      getRoleFromMetadata(user.user_metadata);
    if (role !== "unidad") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
