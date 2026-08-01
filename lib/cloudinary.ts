export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured");
  }

  const formData = new FormData();
  formData.set("file", file);
  formData.set("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Photo upload failed");
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

// Cloudinary can transform-on-deliver via a URL segment right after "/upload/".
// Without this, <Image unoptimized /> downloads and decodes the full original
// (often several MB / 12MP+ from a phone camera) just to show a small thumbnail,
// which can crash mobile Safari's renderer under memory pressure once a page
// has more than a handful of photos.
export function cloudinaryTransform(url: string, transform: string): string {
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const insertAt = index + marker.length;
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`;
}

export function cloudinaryThumb(url: string, size: number): string {
  return cloudinaryTransform(url, `w_${size},h_${size},c_fill,q_auto,f_auto`);
}

export function cloudinaryPreview(url: string, maxSize: number): string {
  return cloudinaryTransform(url, `w_${maxSize},h_${maxSize},c_limit,q_auto,f_auto`);
}
