"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
};

export async function syncHolidaysAction(countryCode: string, year: number) {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("holidays")
    .select("id", { count: "exact", head: true })
    .eq("country_code", countryCode)
    .eq("year", year);

  if ((count ?? 0) > 0) return { ok: true, cached: true };

  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) return { ok: false, message: `Nager.Date no tiene festivos para ${countryCode}` };

  const holidays: NagerHoliday[] = await res.json();

  if (holidays.length === 0) return { ok: true, cached: false };

  const rows = holidays.map((h) => ({
    country_code: countryCode,
    year,
    date: h.date,
    name: h.localName || h.name
  }));

  const { error } = await supabase.from("holidays").upsert(rows, { onConflict: "country_code,date" });

  if (error) return { ok: false, message: error.message };
  return { ok: true, cached: false };
}
