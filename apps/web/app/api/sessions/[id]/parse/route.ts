import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { parseReceiptImage } from "@/lib/ai/parseReceipt";
import { prisma } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await prisma.splitSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const form = await request.formData();
  const uploaded = form.get("image");

  // React Native multipart uploads may arrive as Blob (not always File).
  if (!(uploaded instanceof Blob)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const mediaType =
    uploaded.type && uploaded.type !== "application/octet-stream"
      ? uploaded.type
      : "image/jpeg";

  if (!ALLOWED.has(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  if (uploaded.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be under 10MB." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await uploaded.arrayBuffer());

  let parsed;
  try {
    parsed = await parseReceiptImage({
      mediaType,
      data: buffer,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to parse receipt";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const ext =
    mediaType === "image/png"
      ? "png"
      : mediaType === "image/webp"
        ? "webp"
        : mediaType === "image/gif"
          ? "gif"
          : "jpg";
  const imagePath = path.join("uploads", `${id}.${ext}`);
  await writeFile(path.join(process.cwd(), imagePath), buffer);

  await prisma.$transaction(async (tx) => {
    await tx.itemAssignment.deleteMany({
      where: { item: { sessionId: id } },
    });
    await tx.item.deleteMany({ where: { sessionId: id } });

    await tx.splitSession.update({
      where: { id },
      data: {
        merchant: parsed.merchant,
        currency: parsed.currency || "USD",
        tax: parsed.tax ?? 0,
        tip: parsed.tip ?? 0,
        imagePath,
      },
    });

    if (parsed.items.length > 0) {
      await tx.item.createMany({
        data: parsed.items.map((item) => ({
          id: nanoid(10),
          sessionId: id,
          name: item.name,
          price: item.price,
          quantity: item.quantity ?? 1,
        })),
      });
    }
  });

  const session = await getSessionPayload(id);
  return NextResponse.json(session);
}
