"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="flex w-full items-center gap-4 px-4 py-4 text-destructive transition-colors hover:bg-destructive/5 active:bg-destructive/10"
      onClick={handleLogout}
      type="button"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10">
        <LogOut className="h-5 w-5 text-destructive" />
      </div>
      <span className="font-black">Cerrar sesión</span>
    </button>
  );
}
