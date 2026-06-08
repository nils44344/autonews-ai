// Programmatic "first-time visitor" audit. Fetches every important URL on the
// live site, parses the HTML, and reports defects: bad status codes, missing
// SEO tags, broken internal links, duplicate IDs, layout-blocking patterns,
// missing structured data, etc. Designed to run in CI or one-shot from a dev
// machine. Output is a single Markdown report.
import { writeFileSync } from "node:fs";

const BASE = "https://autonews-ai.live";

interface Defect {
  severity: "HIGH" | "MEDIUM" | "LOW";
  url: string;
  category: string;
  detail: string;
}

const defects: Defect[] = [];
const visited = new Set<string>();

function push(severity: Defect["severity"], url: string, category: string, detail: string) {
  defects.push({ severity, url, category, detail });
}

async function fetchHtml(url: string): Promise<{ status: number; html: string; ms: number; headers: Headers }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "AutonewsAI-FirstVisitorAudit/1.0" } });
    const html = res.status < 400 ? await res.text() : "";
    return { status: res.status, html, ms: Date.now() - t0, headers: res.headers };
  } catch (e) {
    return { status: 0, html: `ERR: ${(e as Error).message}`, ms: Date.now() - t0, headers: new Headers() };
  }
}

// Tiny HTML helpers — avoid pulling in a full parser (we don't need to be perfect).
function getAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1] ?? m[0]);
  return out;
}
function getTitle(html: string): string | null {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
}
function metaContent(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
  const m = html.match(re);
  return m?.[1] ?? null;
}
function hrefsFrom(html: string): string[] {
  return getAll(html, /href=["']([^"']+)["']/g);
}
function countOccurrences(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

async function auditPage(url: string, label: string) {
  if (visited.has(url)) return;
  visited.add(url);

  const { status, html, ms, headers } = await fetchHtml(url);

  if (status === 0) {
    push("HIGH", url, "Network", `Could not fetch: ${html}`);
    return;
  }
  if (status >= 400) {
    push("HIGH", url, "HTTP", `Status ${status} on ${label}`);
    return;
  }
  if (status >= 300 && status < 400) {
    push("MEDIUM", url, "HTTP", `Redirect ${status} (location: ${headers.get("location") ?? "?"})`);
    return;
  }

  if (ms > 1500) push("MEDIUM", url, "Performance", `Slow response: ${ms}ms`);

  // SEO basics
  const title = getTitle(html);
  if (!title) push("HIGH", url, "SEO", "Missing <title>");
  else if (title.length < 10) push("MEDIUM", url, "SEO", `Title too short: "${title}"`);
  else if (title.length > 70) push("LOW", url, "SEO", `Title long (${title.length} chars): "${title}"`);

  const desc = metaContent(html, "description");
  if (!desc) push("HIGH", url, "SEO", "Missing meta description");
  else if (desc.length < 50) push("MEDIUM", url, "SEO", `Description too short: "${desc.slice(0, 80)}"`);

  if (!metaContent(html, "og:title") && !html.includes('property="og:title"'))
    push("MEDIUM", url, "SEO", "Missing og:title");

  // Canonical
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1];
  if (!canonical && !url.endsWith("/watchlist")) push("LOW", url, "SEO", "No canonical link");

  // Schema.org JSON-LD
  if (!html.includes('application/ld+json')) push("LOW", url, "SEO", "No JSON-LD structured data");

  // Layout sanity: H1 must exist exactly once.
  const h1s = getAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g);
  if (h1s.length === 0) push("HIGH", url, "Layout", "No <h1>");
  if (h1s.length > 1) push("MEDIUM", url, "Layout", `Multiple <h1> (${h1s.length})`);

  // Duplicate search bars — our specific concern (homepage had 2)
  const searchPrompts = countOccurrences(html, "Search opportunities");
  if (searchPrompts > 1) push("HIGH", url, "UX", `Duplicate search prompts (${searchPrompts}) — header + hero`);

  // Internal link sanity
  const hrefs = hrefsFrom(html);
  const internal = hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/_next") && !h.startsWith("/api") && !h.includes("#"));
  const unique = Array.from(new Set(internal));

  // Sample-check first 10 internal links for 404
  for (const h of unique.slice(0, 10)) {
    if (visited.has(BASE + h)) continue;
    const res = await fetch(BASE + h, { redirect: "follow" });
    if (res.status >= 400) push("HIGH", BASE + h, "Broken Link", `From ${url} → ${res.status}`);
  }

  // Body content shouldn't be empty
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (bodyText.length < 500) push("HIGH", url, "Content", `Body content tiny (${bodyText.length} chars) — possible render fail`);

  // Open Graph image
  if (!metaContent(html, "og:image")) push("LOW", url, "Social", "No og:image");

  // Print compact status
  console.log(`  ${status} ${ms.toString().padStart(4)}ms  ${label}  (${defects.filter((d) => d.url === url).length} issues)`);
}

async function auditApi(url: string, label: string) {
  const { status, html } = await fetchHtml(url);
  if (status !== 200) push("HIGH", url, "API", `Status ${status} on ${label}`);
  else if (!html.includes("{")) push("HIGH", url, "API", `${label} did not return JSON`);
  else if (html.length < 10) push("MEDIUM", url, "API", `${label} payload very small`);
  console.log(`  ${status} ${label}`);
}

async function main() {
  console.log("=== FIRST-VISITOR AUDIT ===\n");
  console.log("Pages:");

  const pages: [string, string][] = [
    ["/", "Homepage"],
    ["/opportunities", "Opportunities index"],
    ["/signals", "Signals feed"],
    ["/tools", "Tools index"],
    ["/workflows", "Workflows index"],
    ["/startups", "Startups index"],
    ["/news", "News hub"],
    ["/watchlist", "Watchlist"],
    ["/blog", "Blog"],
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/editorial-policy", "Editorial policy"],
    ["/opportunities/ai-newsletter-for-indian-smbs", "Opportunity detail"],
    ["/tools/claude", "Tool detail"],
    ["/workflows/daily-faceless-youtube-pipeline", "Workflow detail"],
    ["/startups/anthropic", "Startup detail"],
    ["/category/ai", "Category page"],
  ];
  for (const [path, label] of pages) await auditPage(BASE + path, label);

  console.log("\nAPIs:");
  await auditApi(BASE + "/api/health", "Health");
  await auditApi(BASE + "/api/search?q=claude", "Search");

  console.log("\nSitemap + robots:");
  const sm = await fetchHtml(BASE + "/sitemap.xml");
  if (sm.status !== 200) push("HIGH", BASE + "/sitemap.xml", "SEO", `Sitemap status ${sm.status}`);
  const urlCount = (sm.html.match(/<url>/g) ?? []).length;
  console.log(`  ${sm.status}  Sitemap (${urlCount} URLs)`);
  if (urlCount < 50) push("MEDIUM", BASE + "/sitemap.xml", "SEO", `Sitemap only has ${urlCount} URLs (expected 200+)`);

  const robots = await fetchHtml(BASE + "/robots.txt");
  console.log(`  ${robots.status}  robots.txt`);
  if (!robots.html.includes("Sitemap:")) push("MEDIUM", BASE + "/robots.txt", "SEO", "robots.txt missing Sitemap directive");

  // Report
  const high = defects.filter((d) => d.severity === "HIGH");
  const med = defects.filter((d) => d.severity === "MEDIUM");
  const low = defects.filter((d) => d.severity === "LOW");
  console.log(`\n=== SUMMARY ===`);
  console.log(`HIGH:   ${high.length}`);
  console.log(`MEDIUM: ${med.length}`);
  console.log(`LOW:    ${low.length}`);

  const md = [
    "# First-Visitor Audit Report",
    `Generated: ${new Date().toISOString()}`,
    "",
    `**Defects:** ${high.length} HIGH · ${med.length} MEDIUM · ${low.length} LOW`,
    "",
    ...["HIGH", "MEDIUM", "LOW"].flatMap((sev) => {
      const items = defects.filter((d) => d.severity === sev);
      if (items.length === 0) return [];
      return [
        `## ${sev} (${items.length})`,
        "| URL | Category | Detail |",
        "|---|---|---|",
        ...items.map((d) => `| ${d.url.replace(BASE, "")} | ${d.category} | ${d.detail.replace(/\|/g, "\\|")} |`),
        "",
      ];
    }),
  ].join("\n");

  writeFileSync("first-visitor-report.md", md);
  console.log("\nReport saved to first-visitor-report.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
