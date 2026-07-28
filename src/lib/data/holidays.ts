import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncHolidaysAction } from "@/lib/actions/admin/holidays";

const _fetchHolidays = unstable_cache(
  async (countryCode: string, year: number) => {
    const adminClient = createAdminClient();
    const { data: holidays } = await adminClient
      .from("holidays")
      .select("date")
      .eq("country_code", countryCode)
      .eq("year", year);

    if (holidays && holidays.length > 0) {
      return holidays.map((h: { date: string }) => h.date);
    }

    const syncResult = await syncHolidaysAction(countryCode, year);
    if (syncResult.ok) {
      const { data: fresh } = await adminClient
        .from("holidays")
        .select("date")
        .eq("country_code", countryCode)
        .eq("year", year);
      return (fresh ?? []).map((h: { date: string }) => h.date);
    }
    return [];
  },
  ["holidays"],
  { revalidate: 3600 }
);

export const getHolidayDates = (countryCode: string, year: number) =>
  _fetchHolidays(countryCode, year);
