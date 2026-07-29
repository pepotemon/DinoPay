"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function AutoToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read directly from the live URL so this is idempotent on double-runs
    const url = new URL(window.location.href);
    const ok = url.searchParams.get("ok");
    const error = url.searchParams.get("error");

    if (!ok && !error) return;

    // Clean URL first so a second effect run sees nothing to do
    url.searchParams.delete("ok");
    url.searchParams.delete("error");
    window.history.replaceState(null, "", url.toString());

    if (ok) toast.success(ok);
    if (error) toast.error(error);
  }, [searchParams]);

  return null;
}
