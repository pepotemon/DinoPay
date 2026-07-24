"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function AutoToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ok = searchParams.get("ok");
    const error = searchParams.get("error");

    if (!ok && !error) return;

    if (ok) toast.success(ok);
    if (error) toast.error(error);

    // Remove params from URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("ok");
    url.searchParams.delete("error");
    window.history.replaceState(null, "", url.toString());
  }, [searchParams, router]);

  return null;
}
