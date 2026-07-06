import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const WidgetConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

const UiLayoutSchema = new Schema(
  {
    page: { type: String, required: true, unique: true, index: true },
    widgets: { type: [WidgetConfigSchema], default: [] },
  },
  { timestamps: true },
);

export type UiLayoutDocument = InferSchemaType<typeof UiLayoutSchema>;

export const UiLayout: Model<UiLayoutDocument> =
  models.UiLayout || model<UiLayoutDocument>("UiLayout", UiLayoutSchema);
