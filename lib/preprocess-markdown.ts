/**
 * Markdown & LaTeX Preprocessor for CloseAI
 *
 * Normalizes LaTeX math blocks, equations, currency symbols, and tables to ensure
 * remark-math and rehype-katex parse formulas cleanly without breaking subsequent markdown.
 */

export function preprocessContent(text: string): string {
  if (!text) return "";

  // 1. Auto-close dangling unclosed code blocks (```) during streaming/interrupted generation
  // We do this first so code blocks are balanced and won't get affected by downstream text manipulations
  let result = text;
  const codeBlockCount = (result.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    result += "\n```";
  }

  // Split by code blocks (``` ... ```) so that any math symbols, dollar signs, or formatting inside
  // code blocks are never altered or damaged.
  const parts = result.split(/(```[\s\S]*?```)/g);

  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];
    if (!segment) continue;

    // A. Convert pipe-pipe separated lines into proper markdown table rows with newlines
    segment = segment.replace(/\|\s*\|\s*/g, "|\n| ");

    // B. Prevent currency dollar signs ($100, $1 Trillion, $2.5B, etc.) from being parsed as LaTeX math.
    // In KaTeX / remark-math, any $ followed immediately by a digit is a monetary amount, not a formula.
    segment = segment.replace(/(?<!\\)\$(?=\d)/g, "\\$");

    // C. Normalize LaTeX display brackets \[ ... \] into isolated display math blocks $$ ... $$
    // We isolate on new lines (\n\n$$\n...\n$$\n\n) so remark-math recognizes block math fences properly
    // and doesn't discard equation lines as fence info-strings or fail to close the block.
    segment = segment.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      return `\n\n$$\n${math.trim()}\n$$\n\n`;
    });

    // D. Normalize LaTeX inline brackets \( ... \) into inline math $...$
    // We trim so remark-math / Pandoc rules don't discard inline math with leading/trailing spaces ($ x $).
    segment = segment.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      return `$${math.trim()}$`;
    });

    // E. Auto-wrap raw LaTeX environments (\begin{aligned}, \begin{equation}, etc.) that are NOT already inside $$
    segment = segment.replace(
      /(\\begin\{(?:aligned|align|equation|gather|pmatrix|bmatrix|vmatrix|matrix|cases)\*?\}[\s\S]*?\\end\{(?:aligned|align|equation|gather|pmatrix|bmatrix|vmatrix|matrix|cases)\*?\})/g,
      (match, math, offset, fullString) => {
        const before = fullString.slice(0, offset);
        const dollarCount = (before.match(/\$\$/g) || []).length;
        // If dollarCount is odd, this environment is already inside an opening $$ fence
        if (dollarCount % 2 === 1) {
          return match;
        }
        return `\n\n$$\n${math.trim()}\n$$\n\n`;
      }
    );

    // F. Isolate all $$ ... $$ display math blocks onto their own lines.
    // This fixes the critical issue where models output:
    //   $$\begin{aligned} ... \end{aligned}$$ Where:
    // which caused remark-math to treat \begin{aligned} as an info-string and fail to recognize
    // $$ Where: as a closing fence, swallowing all subsequent markdown into an unclosed math block!
    segment = segment.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      return `\n\n$$\n${math.trim()}\n$$\n\n`;
    });

    // G. Fix unescaped underscores inside \text{...} in math formulas
    segment = segment.replace(/\\text\{([^}]+)\}/g, (_, inner) => {
      return `\\text{${inner.replace(/(?<!\\)_/g, "\\_")}}`;
    });

    // H. Clean up awkward spaced asterisks like "* *, **"
    segment = segment.replace(/\*\s+\*,\s+\*\*/g, ", **");

    // I. Auto-close dangling unclosed display math ($$) during streaming or generation cutoff
    const displayMathCount = (segment.match(/\$\$/g) || []).length;
    if (displayMathCount % 2 !== 0) {
      segment += "\n$$";
    }

    // J. Auto-close dangling bold (**) during streaming/interrupted generation
    const boldCount = (segment.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      segment += "**";
    }

    parts[i] = segment;
  }

  return parts.join("");
}
