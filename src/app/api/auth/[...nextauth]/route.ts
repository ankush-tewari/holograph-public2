// src/app/api/auth/[...nextauth]/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("Auth GET route is alive!", { status: 200 });
}

export function POST() {
  return new Response("Auth POST route is alive!", { status: 200 });
}
