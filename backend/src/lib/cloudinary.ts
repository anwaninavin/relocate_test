import { v2 as cloudinary } from "cloudinary";

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  // Logged at startup rather than only on first upload attempt, so a missing/misnamed
  // env var on the host (e.g. Render) shows up immediately in the deploy logs.
  console.warn(
    "Cloudinary credentials are not fully set (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / " +
      "CLOUDINARY_API_SECRET) — image uploads will fail until they're configured.",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
