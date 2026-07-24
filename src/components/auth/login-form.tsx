"use client";

import { LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getRoleFromMetadata } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const loginEmail = email.includes("@") ? email : `${email}@dinopay.local`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (signInError) {
      setError("Credenciales invalidas.");
      setLoading(false);
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const role =
      getRoleFromMetadata(user?.app_metadata) ??
      getRoleFromMetadata(user?.user_metadata);
    const next = searchParams.get("next");

    router.replace(next ?? (role === "admin" ? "/admin/dashboard" : "/unidad/prestamos"));
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>DinoPay</CardTitle>
        <p className="text-sm text-muted-foreground">Ingreso de administrador o unidad</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Usuario o email
            </label>
            <Input
              autoComplete="username"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="text"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contrasena
            </label>
            <Input
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            <LogIn className="h-4 w-4" />
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
