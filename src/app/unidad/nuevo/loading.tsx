import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente y préstamo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea el cliente y su primer préstamo en un solo flujo.
          </p>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
              ))}
            </div>
            <div className="h-px bg-muted" />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
              ))}
            </div>
            <div className="h-24 rounded-md bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
