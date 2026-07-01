import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hostel Essentials",
    short_name: "Hostel Essentials",
    description:
      "Your all-in-one hostel survival kit — checklist, budget, notes, documents, and more for first-time hostel students.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#8b5e34",
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
