const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const inlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

const renderMarkdown = (content: string) => {
  const blocks = content.trim().split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      if (trimmed.startsWith("```")) {
        const code = trimmed.replace(/^```[a-zA-Z0-9-]*\n?/, "").replace(/```$/, "");
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      }

      if (/^#{1,3}\s/.test(trimmed)) {
        const level = Math.min(trimmed.match(/^#+/)?.[0].length || 2, 3);
        return `<h${level}>${inlineMarkdown(trimmed.replace(/^#{1,3}\s*/, ""))}</h${level}>`;
      }

      const lines = trimmed.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
        return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) {
        return `<ol>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
      }

      return `<p>${lines.map(inlineMarkdown).join("<br />")}</p>`;
    })
    .join("");
};

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage = ({ content }: MarkdownMessageProps) => (
  <div
    className="ai-markdown"
    dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }}
  />
);

export default MarkdownMessage;
