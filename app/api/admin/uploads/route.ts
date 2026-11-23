import { randomBytes } from "node:crypto";
import { getClientIp, isOwnerAuthenticated } from "@/lib/auth";
import { checkUploadRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/security";
import { storeUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, { extension: string; matches: (bytes: Buffer) => boolean }> = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes) =>
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/gif": {
    extension: "gif",
    matches: (bytes) =>
      bytes.subarray(0, 6).toString("ascii") === "GIF87a" ||
      bytes.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) =>
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP",
  },
  "image/avif": {
    extension: "avif",
    matches: (bytes) =>
      bytes.subarray(4, 8).toString("ascii") === "ftyp" &&
      ["avif", "avis"].includes(bytes.subarray(8, 12).toString("ascii")),
  },
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }
  if (!(await isOwnerAuthenticated())) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!(await checkUploadRateLimit(await getClientIp()))) {
    return Response.json({ message: "Too many uploads. Please try again later." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return Response.json({ message: "Choose an image file." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return Response.json({ message: "Images must be between 1 byte and 5 MB." }, { status: 400 });
  }

  const descriptor = allowedTypes[file.type];
  if (!descriptor) {
    return Response.json(
      { message: "Use a JPG, PNG, GIF, WebP or AVIF image." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!descriptor.matches(bytes)) {
    return Response.json({ message: "The image contents do not match its type." }, { status: 400 });
  }

  const filename = `${randomBytes(16).toString("hex")}.${descriptor.extension}`;
  const url = await storeUpload(filename, bytes, file.type);

  return Response.json({ url, name: filename }, { status: 201 });
}
