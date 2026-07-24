import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUnitForm } from "@/components/admin/create-unit-form";
import { createUnitAction } from "@/lib/actions/admin/unidades";

export default function NuevaUnidadPage() {
  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Nueva unidad</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea el usuario operativo y su configuracion inicial.
          </p>
        </CardHeader>
        <CardContent>
          <CreateUnitForm createUnit={createUnitAction} />
        </CardContent>
      </Card>
    </div>
  );
}
