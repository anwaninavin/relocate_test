import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Safety-net record for /wa-login registration attempts that never completed. Created when
 * a visitor enters a mobile number that isn't registered yet and clicks Go; deleted once
 * that number successfully finishes registration. Lets admin staff see (and manually follow
 * up with) anyone who started but never sent the WhatsApp confirmation message. */
const TempUserSchema = new Schema(
  {
    mobile: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

export type TempUserDocument = InferSchemaType<typeof TempUserSchema>;

export const TempUser: Model<TempUserDocument> =
  models.TempUser || model<TempUserDocument>("TempUser", TempUserSchema);
