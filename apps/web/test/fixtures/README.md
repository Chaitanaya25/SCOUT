# Test fixtures

Tiny, text-based resume files used by `lib/resume-text.test.ts`:

- `resume.pdf` — one-page PDF with six lines of text (Helvetica, inside the page bounds)
- `resume.docx` — minimal DOCX with the same six lines
- `blank.pdf` — valid PDF with no text (stands in for a scanned, image-only resume)

They are generated (no dependencies beyond Python 3) with:

```powershell
python apps/web/test/fixtures/make-fixtures.py apps/web/test/fixtures
```
