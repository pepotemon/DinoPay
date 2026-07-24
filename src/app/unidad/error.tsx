"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Algo salio mal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hubo un error al cargar esta pantalla. Intentalo de nuevo.
        </p>
      </div>
      <button
        className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
        onClick={reset}
      >
        Reintentar
      </button>
    </div>
  );
}
