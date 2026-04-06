import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fervet",
    short_name: "Fervet",
    description: "A disciplined personal life OS for visible consistency.",
    start_url: "/",
    display: "standalone",
    background_color: "#08111f",
    theme_color: "#08111f",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
