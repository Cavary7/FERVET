import type { MetadataRoute } from "next";
import { BRANDING } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRANDING.appName,
    short_name: BRANDING.appName,
    description: BRANDING.description,
    start_url: "/",
    display: "standalone",
    background_color: "#08111f",
    theme_color: "#08111f",
    orientation: "portrait",
    icons: [
      {
        src: BRANDING.iconPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
