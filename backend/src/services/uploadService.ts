import { cloudinary } from "@/lib/cloudinary";

/** Uploads a data-URI image to Cloudinary, scoped to the uploading user's own folder,
 * and returns the hosted secure URL to store in place of the raw base64 blob. */
export async function uploadImage(userId: string, dataUri: string) {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `hostel-checklist/${userId}`,
  });

  return { url: result.secure_url, publicId: result.public_id };
}
