import { z } from "zod";

export const uploadImageSchema = z.object({
  // A compressed image already encoded as a data URI (see the frontend's
  // client-side compression step) — this endpoint's job is just to host it on
  // Cloudinary so Mongo stores a short URL instead of the raw base64 blob.
  image: z
    .string()
    .trim()
    .min(1, "Image is required")
    .max(8_000_000, "Image is too large")
    .refine((val) => val.startsWith("data:image/"), {
      message: "Image must be a data URI",
    }),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
