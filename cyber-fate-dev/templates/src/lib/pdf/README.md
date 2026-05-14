# PDF renderer templates

Codex should implement PDF generation as:

```text
Report JSON -> renderHtml(report) -> Playwright page.setContent(html) -> page.pdf()
```

Rules:

- Do not ask LLM to create raw PDF bytes.
- Keep CSS in a template module or stylesheet.
- Stamp assets are SVG/CSS and selected from config.
- Add a smoke test that generated PDF bytes length is greater than zero.
