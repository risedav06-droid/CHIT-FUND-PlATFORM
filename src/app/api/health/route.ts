import { siteConfig } from "@/config/site";

export async function GET() {
  return Response.json({
    status: "ok",
    service: siteConfig.name,
    timestamp: new Date().toISOString(),
  });
}
