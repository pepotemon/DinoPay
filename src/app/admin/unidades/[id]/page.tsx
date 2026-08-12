import { redirect } from "next/navigation";

export default async function AdminUnidadHubPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/unidades/${id}/clientes`);
}
