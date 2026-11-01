import type {MetadataRoute} from "next";
import {publicIndexOrigin} from "@/lib/public-indexing";

export const dynamic = "force-dynamic";

/**
 * The default is a closed index. Public discoverability requires the mosque
 * owner to approve SILA_PUBLIC_INDEXING_ENABLED and SILA_PUBLIC_SITE_URL.
 * Private dashboards, API and kiosk URLs are never offered for indexing.
 */
export default function robots(): MetadataRoute.Robots {
 const origin=publicIndexOrigin(process.env.SILA_PUBLIC_INDEXING_ENABLED,
   process.env.SILA_PUBLIC_SITE_URL);
 if (!origin) return {rules:{userAgent:"*",disallow:"/"}};
 return {
  rules:{userAgent:"*",
   allow:["/visit","/visit/content/","/_next/static/"],
   disallow:"/"},
  sitemap:origin+"/sitemap.xml",
 };
}
