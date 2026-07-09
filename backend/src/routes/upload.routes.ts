import { Router } from "express";

import { uploadImageSchema } from "@/validations/upload";
import { uploadImage } from "@/services/uploadService";
import { requireAuth } from "@/middleware/auth";

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

uploadRouter.post("/image", async (req, res) => {
  const parsed = uploadImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const { url, publicId } = await uploadImage(req.user!._id.toString(), parsed.data.image);
    res.json({ url, publicId });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    res.status(502).json({ error: "Failed to upload image" });
  }
});
