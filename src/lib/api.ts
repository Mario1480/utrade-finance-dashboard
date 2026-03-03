import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function parsePagination(searchParams: URLSearchParams): {
  skip: number;
  take: number;
} {
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "50");

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(limit, 200))
    : 50;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
