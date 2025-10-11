# Content Rendering (Markdown)

- Use `react-markdown` for assistant (and optional system) messages.
- Do not enable raw HTML; escape by default.
- Recommended remark/rehype: `remark-gfm`, `rehype-highlight` (code), `rehype-sanitize` (optional strict schema).
- Links: `target="_blank" rel="noopener noreferrer"`.
- Images: allowed but consider proxying later; for MVP, render `<img>` as-is.
- Max message size: enforce in API (8k chars for `MessageSend.content`).

XSS check: `<script>alert(1)</script>` must render as text, not execute.
