// lib/cloudinary.ts
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  // NOTE: Do NOT append "folder" here — unsigned presets reject it unless
  // the folder is configured inside the preset itself on Cloudinary dashboard.

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    let msg = "Cloudinary upload failed";
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary returned no URL");
  }

  return data.secure_url as string;
}

export function cloudinaryOptimize(url: string, width = 800): string {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
