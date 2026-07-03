import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pack with Me",
    short_name: "Pack with Me",
    description:
      "Your all-in-one hostel survival kit — checklist, budget, notes, documents, and more for first-time hostel students.",
    start_url: "/checklist",
    display: "standalone",
    background_color: "#fdf6ee",
    theme_color: "#c96b9a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
