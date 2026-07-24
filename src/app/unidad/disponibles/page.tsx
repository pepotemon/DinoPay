import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientesDisponiblesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Clientes activos sin prestamo activo.
        </p>
      </CardContent>
    </Card>
  );
}
