import { describe, it, expect } from "vitest";

import {
  escapeHtml,
  sanitizeImageUrl,
  stripHtml,
  stripLinks,
} from "../sanitize";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("escapes all special characters in one string", () => {
    expect(escapeHtml(`<a href="x" onclick='alert(1)'>&`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#039;alert(1)&#039;&gt;&amp;",
    );
  });

  it("returns an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns a safe string unchanged", () => {
    expect(escapeHtml("hello world 123")).toBe("hello world 123");
  });

  // --- XSS vectors ---
  it("neutralizes a <script> tag", () => {
    const input = '<script>alert("XSS")</script>';
    const output = escapeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;");
  });

  it("neutralizes an img onerror XSS vector", () => {
    const input = '<img src=x onerror="alert(1)">';
    const output = escapeHtml(input);
    expect(output).not.toContain("<img");
    expect(output).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("neutralizes event handler injection", () => {
    const input = '" onmouseover="alert(1)"';
    const output = escapeHtml(input);
    expect(output).not.toContain('"');
  });
});

describe("sanitizeImageUrl", () => {
  it("allows a valid https URL", () => {
    const url = "https://example.com/image.png";
    expect(sanitizeImageUrl(url)).toBe(url);
  });

  it("allows a valid http URL", () => {
    const url = "http://example.com/image.png";
    expect(sanitizeImageUrl(url)).toBe(url);
  });

  it("rejects a javascript: URL", () => {
    expect(sanitizeImageUrl("javascript:alert(1)")).toBe("");
  });

  it("rejects a data: URL", () => {
    expect(sanitizeImageUrl("data:image/png;base64,abc")).toBe("");
  });

  it("rejects a file: URL", () => {
    expect(sanitizeImageUrl("file:///etc/passwd")).toBe("");
  });

  it("rejects a blob: URL", () => {
    expect(sanitizeImageUrl("blob:https://example.com/abc")).toBe("");
  });

  it("rejects an ftp: URL", () => {
    expect(sanitizeImageUrl("ftp://example.com/file")).toBe("");
  });

  it("returns empty for a completely invalid URL", () => {
    expect(sanitizeImageUrl("not-a-url")).toBe("");
  });

  it("returns empty for an empty string", () => {
    expect(sanitizeImageUrl("")).toBe("");
  });

  it("normalizes the URL through the URL constructor", () => {
    expect(sanitizeImageUrl("https://example.com")).toBe(
      "https://example.com/",
    );
  });
});

describe("stripHtml", () => {
  it("removes a simple tag", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
  });

  it("removes nested tags", () => {
    expect(stripHtml("<div><p>hello</p></div>")).toBe("hello");
  });

  it("removes self-closing tags", () => {
    expect(stripHtml("line<br/>break")).toBe("linebreak");
  });

  it("removes tags with attributes", () => {
    expect(stripHtml('<a href="https://example.com">link</a>')).toBe("link");
  });

  it("returns an empty string unchanged", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns a string with no tags unchanged", () => {
    expect(stripHtml("just text")).toBe("just text");
  });

  it("strips a script tag (content between tags preserved)", () => {
    expect(stripHtml("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("handles malformed/unclosed tags", () => {
    expect(stripHtml("hello <b>world")).toBe("hello world");
  });

  it("strips XSS img vector", () => {
    expect(stripHtml('<img src=x onerror="alert(1)">')).toBe("");
  });
});

describe("stripLinks", () => {
  it("replaces an https URL with [link removed]", () => {
    expect(stripLinks("visit https://example.com please")).toBe(
      "visit [link removed] please",
    );
  });

  it("replaces an http URL with [link removed]", () => {
    expect(stripLinks("go to http://example.com/page")).toBe(
      "go to [link removed]",
    );
  });

  it("replaces multiple links", () => {
    const input = "see https://a.com and http://b.com for details";
    const output = stripLinks(input);
    expect(output).toBe("see [link removed] and [link removed] for details");
  });

  it("handles URLs with paths, query strings, and fragments", () => {
    expect(
      stripLinks("check https://example.com/path?q=1&r=2#section ok"),
    ).toBe("check [link removed] ok");
  });

  it("returns an empty string unchanged", () => {
    expect(stripLinks("")).toBe("");
  });

  it("returns a string without links unchanged", () => {
    expect(stripLinks("no links here")).toBe("no links here");
  });

  it("does not replace non-http protocols", () => {
    expect(stripLinks("try ftp://example.com")).toBe("try ftp://example.com");
  });

  it("handles a URL at the very start of the string", () => {
    expect(stripLinks("https://example.com is great")).toBe(
      "[link removed] is great",
    );
  });

  it("handles a URL at the very end of the string", () => {
    expect(stripLinks("visit https://example.com")).toBe(
      "visit [link removed]",
    );
  });
});
