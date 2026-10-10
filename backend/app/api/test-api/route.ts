import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  console.log(request);

  return NextResponse.json({ message: "Hello from the API" });
}
