import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized: Invalid or missing API Key" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { company_name, contact_name, contact_email, phone, notes } = body;

    if (!company_name || !contact_name || !contact_email) {
      return NextResponse.json({ error: "Missing required fields (company_name, contact_name, contact_email)" }, { status: 400 });
    }

    // We must attribute the client creation to an admin since the schema requires created_by_user_id.
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "System configuration error: No admin user found to attribute creation." }, { status: 500 });
    }

    const client = await prisma.client.create({
      data: {
        company_name,
        contact_name,
        contact_email,
        phone: phone || null,
        notes: notes ? `[Imported via API] ${notes}` : "[Imported via API]",
        created_by_user_id: adminUser.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Prospect successfully added as a Client.",
      client_id: client.id 
    }, { status: 201 });
  } catch (error) {
    console.error("External API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
