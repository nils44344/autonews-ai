// Minimal, XSS-safe Markdown → HTML renderer.
// Strategy: HTML-escape everything first, THEN introduce a controlled set of
// tags. Because raw input is escaped up front, no model-authored HTML/script
// can survive — only the transforms below emit real tags, and link hrefs are
// restricted to http/https.

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let out = esc(s);
  // links [text](url) — only allow http(s)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
    const safeUrl = url.replace(/"/g, "%22");
    const rel = ' rel="nofollow noopener" target="_blank"';
    return `<a href="${safeUrl}"${rel}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushPara = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushPara();
      closeList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara();
      closeList();
      const level = Math.min(6, Math.max(2, m[1].length)); // demote h1 → h2
      html.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = t.match(/^>\s?(.*)$/))) {
      flushPara();
      closeList();
      html.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = t.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = t.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList();
      paragraph.push(t);
    }
  }
  flushPara();
  closeList();
  return html.join("\n");
}
