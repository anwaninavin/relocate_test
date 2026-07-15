import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const WidgetConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    visible: { type: Boolean, default: true },
    /** Nav-layout-only — which chrome slot this nav item renders in on mobile (the bottom tab
     * bar vs the "more"/3-dot overflow menu). Unused by the dashboard/home-card layouts that
     * share this same schema. */
    placement: { type: String, enum: ["bottom", "overflow"], default: undefined },
    /** Nav-layout-only — admin-chosen position within its placement group. */
    order: { type: Number, default: undefined },
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
