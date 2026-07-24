import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard global</h1>
        <p className="text-sm text-muted-foreground">
          Base inicial del panel administrador.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Unidades activas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Caja total</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">$0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
      </div>
    </div>
  );
}
