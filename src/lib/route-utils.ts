import { ZodError } from "zod";
import { fail } from "@/lib/api";

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "Ungültige Eingabe";
    return fail(first, 400);
  }

  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return fail("Nicht autorisiert", 401);
    }

    if (error.message === "FORBIDDEN") {
      return fail("Keine Berechtigung", 403);
    }

    if (error.message === "RULES_NOT_CONFIGURED") {
      return fail("Regelwerk fehlt", 400);
    }

    return fail(error.message, 400);
  }

  return fail("Unbekannter Fehler", 500);
}
