import { authReady, handlers } from "@/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!authReady) {
    return Response.json({});
  }

  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!authReady) {
    return Response.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  return handlers.POST(request);
}
