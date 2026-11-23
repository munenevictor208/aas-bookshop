import Image from "next/image";

const BLOB_HOST = /^(?:[a-z0-9-]+\.)?public\.blob\.vercel-storage\.com$/i;
const BLOB_PATH_PREFIX = "/aas-bookshop/";

function isManagedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      BLOB_HOST.test(url.hostname) &&
      url.pathname.startsWith(BLOB_PATH_PREFIX)
    );
  } catch {
    return false;
  }
}

export default function ProductImage({
  name,
  imageUrl,
  icon,
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  icon: string;
  className?: string;
}) {
  const src = imageUrl?.trim();
  if (src && (src.startsWith("/uploads/") || isManagedBlobUrl(src))) {
    return (
      <Image
        src={src}
        alt={name}
        width={600}
        height={450}
        unoptimized
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <span className={`flex h-full w-full items-center justify-center ${className}`} aria-hidden>
      {icon}
    </span>
  );
}
