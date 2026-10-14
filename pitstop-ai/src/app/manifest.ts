import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pitstop AI",
    short_name: "Pitstop AI",
    description: "We are there to assist you in choosing your Dream Car.",
    start_url: "/",
    display: "standalone",
    background_color: "#07080a",
    theme_color: "#ff6a3d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
