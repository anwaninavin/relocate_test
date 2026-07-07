import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ElementLayoutOverrideSchema = new Schema(
  {
    x: { type: Number },
    y: { type: Number },
    scale: { type: Number },
    rotation: { type: Number },
    visible: { type: Boolean },
    zIndex: { type: Number },
  },
  { _id: false },
);

const ElementOverrideSchema = new Schema(
  {
    id: { type: String, required: true },
    section: { type: Number },
    kind: { type: String },
    src: { type: String },
    alt: { type: String },
    emoji: { type: String },
    lines: { type: [String] },
    ctaLabel: { type: String },
    href: { type: String },
    background: { type: String },
    shape: { type: String },
    textStyle: { type: String },
    textColor: { type: String },
    fontSize: { type: String },
    bold: { type: Boolean },
    isCustom: { type: Boolean },
    layouts: {
      mobile: { type: ElementLayoutOverrideSchema },
      desktop: { type: ElementLayoutOverrideSchema },
    },
  },
  { _id: false },
);

const SectionBackgroundOverrideSchema = new Schema(
  {
    id: { type: String, required: true },
    background: { type: String, required: true },
  },
  { _id: false },
);

const LandingDesignSchema = new Schema(
  {
    page: { type: String, required: true, unique: true, index: true },
    elements: { type: [ElementOverrideSchema], default: [] },
    sectionBackgrounds: { type: [SectionBackgroundOverrideSchema], default: [] },
  },
  { timestamps: true },
);

export type LandingDesignDocument = InferSchemaType<typeof LandingDesignSchema>;

export const LandingDesign: Model<LandingDesignDocument> =
  models.LandingDesign || model<LandingDesignDocument>("LandingDesign", LandingDesignSchema);
