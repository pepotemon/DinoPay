"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateClientLoanState = {
  ok: boolean;
  message: string;
};

const createClientLoanSchema = z.object({
  alias: z.string().min(2, "El alias del cliente es obligatorio."),
  nit: z.string().optional(),
  direccion1: z.string().optional(),
  direccion2: z.string().optional(),
  barrio: z.string().optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  genero: z.enum(["", "masculino", "femenino", "otro"]),
  modalidad: z.enum(["diaria", "semanal", "quincenal", "mensual"]),
  interes: z.coerce.number().min(0).max(100),
  valorNeto: z.coerce.number().positive("El valor neto debe ser mayor a 0."),
  numeroCuotas: z.coerce.number().int().min(1, "Debe haber al menos una cuota.")
});

const createExistingClientLoanSchema = z.object({
  clientId: z.string().uuid(),
  modalidad: z.enum(["diaria", "semanal", "quincenal", "mensual"]),
  interes: z.coerce.number().min(0).max(100),
  valorNeto: z.coerce.number().positive("El valor neto debe ser mayor a 0."),
  numeroCuotas: z.coerce.number().int().min(1, "Debe haber al menos una cuota.")
});

export async function createClientLoanAction(
  _previousState: CreateClientLoanState,
  formData: FormData
): Promise<CreateClientLoanState> {
  const parsed = createClientLoanSchema.safeParse({
    alias: formData.get("alias"),
    nit: formData.get("nit"),
    direccion1: formData.get("direccion1"),
    direccion2: formData.get("direccion2"),
    barrio: formData.get("barrio"),
    telefono1: formData.get("telefono1"),
    telefono2: formData.get("telefono2"),
    genero: formData.get("genero") ?? "",
    modalidad: formData.get("modalidad"),
    interes: formData.get("interes"),
    valorNeto: formData.get("valorNeto"),
    numeroCuotas: formData.get("numeroCuotas")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Tu sesion expiro. Inicia sesion de nuevo."
    };
  }

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("id, intereses")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!unit) {
    return {
      ok: false,
      message: "Solo una unidad activa puede crear clientes y prestamos."
    };
  }

  const input = parsed.data;
  const allowedInterests = Array.isArray(unit.intereses) ? unit.intereses : [];

  if (!allowedInterests.includes(input.interes)) {
    return {
      ok: false,
      message: "Ese interes no esta habilitado para esta unidad."
    };
  }

  const { error } = await adminClient.rpc("create_client_with_loan", {
    p_unit_id: user.id,
    p_alias: input.alias,
    p_nit: input.nit ?? "",
    p_direccion1: input.direccion1 ?? "",
    p_direccion2: input.direccion2 ?? "",
    p_barrio: input.barrio ?? "",
    p_telefono1: input.telefono1 ?? "",
    p_telefono2: input.telefono2 ?? "",
    p_genero: input.genero,
    p_modalidad: input.modalidad,
    p_interes: input.interes,
    p_valor_neto: input.valorNeto,
    p_numero_cuotas: input.numeroCuotas
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  const enrutar = formData.get("enrutar") === "1";
  redirect(enrutar ? "/unidad/enrutar" : "/unidad/prestamos");
}

export async function createExistingClientLoanAction(
  _previousState: CreateClientLoanState,
  formData: FormData
): Promise<CreateClientLoanState> {
  const parsed = createExistingClientLoanSchema.safeParse({
    clientId: formData.get("clientId"),
    modalidad: formData.get("modalidad"),
    interes: formData.get("interes"),
    valorNeto: formData.get("valorNeto"),
    numeroCuotas: formData.get("numeroCuotas")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Tu sesion expiro. Inicia sesion de nuevo."
    };
  }

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("id, intereses")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!unit) {
    return {
      ok: false,
      message: "Solo una unidad activa puede crear prestamos."
    };
  }

  const input = parsed.data;
  const allowedInterests = Array.isArray(unit.intereses) ? unit.intereses : [];

  if (!allowedInterests.includes(input.interes)) {
    return {
      ok: false,
      message: "Ese interes no esta habilitado para esta unidad."
    };
  }

  const { error } = await adminClient.rpc("create_loan_for_existing_client", {
    p_unit_id: user.id,
    p_client_id: input.clientId,
    p_modalidad: input.modalidad,
    p_interes: input.interes,
    p_valor_neto: input.valorNeto,
    p_numero_cuotas: input.numeroCuotas
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  redirect("/unidad/prestamos");
}
