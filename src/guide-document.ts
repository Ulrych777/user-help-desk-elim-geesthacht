export type GuideNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: GuideNode[] };
export function safeGuideLink(value: unknown): value is string {
  return typeof value === "string" && value.length <= 2000 && /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(value) && !/[\u0000-\u0020\u007f]/.test(value);
}
export function validateGuideDocument(value: unknown, imageIds: string[]): GuideNode {
  let nodes = 0, characters = 0;
  const invalid = (): never => { throw new Error("Der Anleitungstext enthält ungültige oder zu viele Inhalte."); };
  const blocks = ["paragraph", "heading", "bulletList", "orderedList", "blockquote", "horizontalRule", "guideImage"];
  function read(value: unknown, allowed: string[], depth: number): GuideNode {
    if (++nodes > 3000 || depth > 12 || !value || typeof value !== "object" || Array.isArray(value)) invalid();
    const n = value as GuideNode;
    if (!allowed.includes(n.type)) invalid();
    const result: GuideNode = { type: n.type };
    if (n.type === "text") {
      if (typeof n.text !== "string" || !n.text.length || (characters += n.text.length) > 20000) invalid();
      result.text = n.text;
      if (n.marks !== undefined) {
        if (!Array.isArray(n.marks) || n.marks.length > 5) invalid();
        result.marks = n.marks.map(mark => {
          if (!mark || !["bold", "italic", "underline", "strike", "link"].includes(mark.type)) invalid();
          if (mark.type === "link") {
            if (!safeGuideLink(mark.attrs?.href)) invalid();
            return { type: "link", attrs: { href: mark.attrs!.href } };
          }
          return { type: mark.type };
        });
      }
      return result;
    }
    if (n.type === "guideImage") {
      if (typeof n.attrs?.imageId !== "string" || !imageIds.includes(n.attrs.imageId)) invalid();
      result.attrs = { imageId: n.attrs!.imageId };
      return result;
    }
    if (["horizontalRule", "hardBreak"].includes(n.type)) return result;
    if (n.type === "heading") {
      if (![2, 3].includes(Number(n.attrs?.level))) invalid();
      result.attrs = { level: Number(n.attrs!.level) };
    }
    if (n.type === "orderedList") {
      const start = Number(n.attrs?.start ?? 1);
      if (!Number.isInteger(start) || start < 1 || start > 1000) invalid();
      result.attrs = { start };
    }
    const children = n.content ?? [];
    if (!Array.isArray(children)) invalid();
    const childTypes = ["paragraph", "heading"].includes(n.type) ? ["text", "hardBreak"] :
      ["bulletList", "orderedList"].includes(n.type) ? ["listItem"] : blocks;
    result.content = children.map(child => read(child, childTypes, depth + 1));
    if (n.type === "listItem" && result.content[0]?.type !== "paragraph") invalid();
    if (["doc", "bulletList", "orderedList", "blockquote"].includes(n.type) && !result.content.length) invalid();
    return result;
  }
  return read(value, ["doc"], 0);
}
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function renderGuideDocument(document: GuideNode, image: (id: string) => string): string {
  function render(n: GuideNode): string {
    if (n.type === "text") return (n.marks || []).reduce((html, mark) => {
      if (mark.type === "link") return safeGuideLink(mark.attrs?.href) ? `<a href="${escape(mark.attrs!.href)}" rel="noopener noreferrer">${html}</a>` : html;
      const tag = ({ bold: "strong", italic: "em", underline: "u", strike: "s" } as Record<string, string>)[mark.type];
      return tag ? `<${tag}>${html}</${tag}>` : html;
    }, escape(n.text));
    if (n.type === "guideImage") return image(String(n.attrs?.imageId));
    if (n.type === "hardBreak") return "<br>";
    if (n.type === "horizontalRule") return "<hr>";
    const content = (n.content || []).map(render).join("");
    if (n.type === "doc") return content;
    const tag = ({ paragraph: "p", heading: Number(n.attrs?.level) === 3 ? "h3" : "h2", bulletList: "ul", orderedList: "ol", listItem: "li", blockquote: "blockquote" } as Record<string, string>)[n.type];
    return tag ? `<${tag}${n.type === "orderedList" ? ` start="${Number(n.attrs?.start) || 1}"` : ""}>${content}</${tag}>` : "";
  }
  return render(document);
}
