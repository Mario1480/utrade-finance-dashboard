import { z } from "zod";

export const monthStringSchema = z.string().regex(/^\d{4}-\d{2}$/, "Monat muss YYYY-MM sein");

export function monthStringToDate(value: string): Date {
  const checked = monthStringSchema.parse(value);
  return new Date(`${checked}-01T00:00:00.000Z`);
}

export function dateToMonthString(value: Date): string {
  return value.toISOString().slice(0, 7);
}
