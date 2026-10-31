/** Same escaped, restricted Markdown subset as the pharmacy profile editor. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

//===================================================================

function renderInlineMarkdown(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(
    /\[([^\]]+)]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/gi,
    '<a href="$2">$1</a>'
  );

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  return html;
}

//===================================================================

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const blocks: string[] = [];

  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '&nbsp;') {
      blocks.push('<p><br></p>');
      index += 1;
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);

    if (heading) {
      const level = heading[1]?.length ?? 1;

      blocks.push(
        `<h${level}>${renderInlineMarkdown(heading[2] ?? '')}</h${level}>`
      );

      index += 1;

      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInlineMarkdown((lines[index] ?? '').replace(/^[-*]\s+/, ''))}</li>`
        );

        index += 1;
      }

      blocks.push(`<ul>${items.join('')}</ul>`);

      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInlineMarkdown((lines[index] ?? '').replace(/^\d+\.\s+/, ''))}</li>`
        );

        index += 1;
      }

      blocks.push(`<ol>${items.join('')}</ol>`);

      continue;
    }

    const paragraphLines: string[] = [line];

    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? '';

      if (
        !nextLine.trim() ||
        /^(#{1,6})\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(
      `<p>${paragraphLines.map(renderInlineMarkdown).join('<br>')}</p>`
    );
  }

  return blocks.join('');
}
