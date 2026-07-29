"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type CreateUnitState = {
  ok: boolean;
  message: string;
  credentials?: {
    username: string;
    loginEmail: string;
  };
};

const createUnitSchema = z
  .object({
    username: z
      .string()
      .min(3, "El username debe tener al menos 3 caracteres.")
      .regex(/^[a-z0-9._-]+$/i, "Usa solo letras, numeros, punto, guion o guion bajo.")
      .transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
    nombreUnidad: z.string().min(2, "El nombre de la unidad es obligatorio."),
    encargado: z.string().min(2, "El encargado es obligatorio."),
    telefono: z.string().optional(),
    capitalInicial: z.coerce.number().min(0, "El capital inicial no puede ser negativo."),
    pais: z.string().min(2, "El pais es obligatorio."),
    paisCodigo: z.string().length(2, "Codigo de pais invalido."),
    estado: z.string().min(2, "El estado/departamento es obligatorio."),
    ciudad: z.string().min(2, "La ciudad es obligatoria."),
    zonaHoraria: z
      .string()
      .min(2, "La zona horaria es obligatoria.")
      .refine(isValidTimeZone, "Usa una zona horaria valida, por ejemplo America/Belem."),
    puedeEliminarAbonos: z.coerce.boolean().default(false),
    puedeEliminarPrestamos: z.coerce.boolean().default(false),
    diasLaborales: z.array(z.coerce.number().int().min(0).max(6)).min(1),
    intereses: z
      .string()
      .min(1, "Agrega al menos un interes.")
      .transform((value) =>
        value
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item))
      )
      .refine((values) => values.length > 0, "Agrega al menos un interes.")
      .refine(
        (values) => values.every((value) => value >= 0 && value <= 100),
        "Los intereses deben estar entre 0 y 100."
      )
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"]
  });

const updateUnitSchema = z.object({
  unitId: z.string().uuid(),
  nombreUnidad: z.string().min(2, "El nombre de la unidad es obligatorio."),
  encargado: z.string().min(2, "El encargado es obligatorio."),
  telefono: z.string().optional(),
  capitalInicial: z.coerce.number().min(0, "El capital inicial no puede ser negativo."),
  pais: z.string().min(2, "El pais es obligatorio."),
  estado: z.string().min(2, "El estado/departamento es obligatorio."),
  ciudad: z.string().min(2, "La ciudad es obligatoria."),
  zonaHoraria: z
    .string()
    .min(2, "La zona horaria es obligatoria.")
    .refine(isValidTimeZone, "Usa una zona horaria valida, por ejemplo America/Belem."),
  puedeEliminarAbonos: z.coerce.boolean().default(false),
  puedeEliminarPrestamos: z.coerce.boolean().default(false),
  activo: z.coerce.boolean().default(false),
  diasLaborales: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  intereses: z
    .string()
    .min(1, "Agrega al menos un interes.")
    .transform((value) =>
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item))
    )
    .refine((values) => values.length > 0, "Agrega al menos un interes.")
    .refine(
      (values) => values.every((value) => value >= 0 && value <= 100),
      "Los intereses deben estar entre 0 y 100."
    )
});

export async function createUnitAction(
  _previousState: CreateUnitState,
  formData: FormData
): Promise<CreateUnitState> {
  const raw = {
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    nombreUnidad: formData.get("nombreUnidad"),
    encargado: formData.get("encargado"),
    telefono: formData.get("telefono"),
    capitalInicial: formData.get("capitalInicial"),
    pais: formData.get("pais"),
    paisCodigo: formData.get("paisCodigo"),
    estado: formData.get("estado"),
    ciudad: formData.get("ciudad"),
    zonaHoraria: formData.get("zonaHoraria"),
    puedeEliminarAbonos: formData.get("puedeEliminarAbonos") === "on",
    puedeEliminarPrestamos: formData.get("puedeEliminarPrestamos") === "on",
    diasLaborales: formData.getAll("diasLaborales"),
    intereses: formData.get("intereses")
  };

  const parsed = createUnitSchema.safeParse(raw);

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
  const { data: admin, error: adminLookupError } = await adminClient
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminLookupError || !admin) {
    return {
      ok: false,
      message: adminLookupError?.message ?? "Solo un administrador puede crear unidades."
    };
  }

  const input = parsed.data;
  const loginEmail = `${input.username}@dinopay.local`;

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email: loginEmail,
      password: input.password,
      email_confirm: true,
      app_metadata: {
        role: "unidad"
      },
      user_metadata: {
        username: input.username,
        nombre_unidad: input.nombreUnidad
      }
    });

  if (createUserError || !createdUser.user) {
    return {
      ok: false,
      message: createUserError?.message ?? "No se pudo crear el usuario de unidad."
    };
  }

  const { error: insertError } = await adminClient.from("units").insert({
    id: createdUser.user.id,
    admin_id: user.id,
    username: input.username,
    nombre_unidad: input.nombreUnidad,
    encargado: input.encargado,
    telefono: input.telefono || null,
    capital_inicial: input.capitalInicial,
    pais: input.pais,
    pais_codigo: input.paisCodigo,
    estado: input.estado,
    ciudad: input.ciudad,
    zona_horaria: input.zonaHoraria,
    dias_laborales: input.diasLaborales,
    puede_eliminar_abonos: input.puedeEliminarAbonos,
    puede_eliminar_prestamos: input.puedeEliminarPrestamos,
    intereses: input.intereses
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return {
      ok: false,
      message: insertError.message
    };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/unidades/nueva");

  return {
    ok: true,
    message: "Unidad creada correctamente.",
    credentials: {
      username: input.username,
      loginEmail
    }
  };
}

export async function updateUnitAction(formData: FormData) {
  const unitId = formData.get("unitId");
  const raw = {
    unitId,
    nombreUnidad: formData.get("nombreUnidad"),
    encargado: formData.get("encargado"),
    telefono: formData.get("telefono"),
    capitalInicial: formData.get("capitalInicial"),
    pais: formData.get("pais"),
    estado: formData.get("estado"),
    ciudad: formData.get("ciudad"),
    zonaHoraria: formData.get("zonaHoraria"),
    puedeEliminarAbonos: formData.get("puedeEliminarAbonos") === "on",
    puedeEliminarPrestamos: formData.get("puedeEliminarPrestamos") === "on",
    activo: formData.get("activo") === "on",
    diasLaborales: formData.getAll("diasLaborales"),
    intereses: formData.get("intereses")
  };

  const errorDest =
    typeof unitId === "string" ? `/admin/unidades/${unitId}/editar` : "/admin/unidades";
  const parsed = updateUnitSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(`${errorDest}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Revisa los datos.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: unit, error: lookupError } = await adminClient
    .from("units")
    .select("id")
    .eq("id", parsed.data.unitId)
    .eq("admin_id", user.id)
    .maybeSingle();

  if (lookupError || !unit) {
    redirect(`${errorDest}?error=${encodeURIComponent(lookupError?.message ?? "Unidad no encontrada.")}`);
  }

  const input = parsed.data;
  const { error } = await adminClient
    .from("units")
    .update({
      nombre_unidad: input.nombreUnidad,
      encargado: input.encargado,
      telefono: input.telefono || null,
      capital_inicial: input.capitalInicial,
      pais: input.pais,
      estado: input.estado,
      ciudad: input.ciudad,
      zona_horaria: input.zonaHoraria,
      dias_laborales: input.diasLaborales,
      puede_eliminar_abonos: input.puedeEliminarAbonos,
      puede_eliminar_prestamos: input.puedeEliminarPrestamos,
      intereses: input.intereses,
      activo: input.activo
    })
    .eq("id", input.unitId)
    .eq("admin_id", user.id);

  if (error) {
    redirect(`${errorDest}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/unidades");
  revalidatePath(`/admin/unidades/${input.unitId}`);
  revalidatePath(`/admin/unidades/${input.unitId}/editar`);
  revalidatePath("/unidad/prestamos");

  redirect(`/admin/unidades/${input.unitId}?ok=${encodeURIComponent("Unidad actualizada.")}`);
}
