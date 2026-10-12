import zipfile, sys
out = sys.argv[1]
LINES = [
    "Test Student - B.Tech Computer Science, graduating 2028",
    "Skills: Python, PyTorch, SQL, FastAPI, Docker, machine learning",
    "Project: Scout, a job radar built with Next.js, Supabase and Gemini",
    "Experience: ML intern at Example Labs, built a ranking model",
    "Education: Example Institute of Technology, CGPA 8.9",
    "Achievements: Smart India Hackathon finalist, Kaggle notebooks",
]
def pdf(lines, path):
    ops = ["BT /F1 11 Tf 50 750 Td 14 TL"] + [f"({l}) Tj T*" for l in lines] + ["ET"] if lines else [""]
    stream = "\n".join(ops)
    objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    s = "%PDF-1.4\n"; offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(s)); s += f"{i} 0 obj\n{o}\nendobj\n"
    x = len(s)
    s += f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n" + "".join(f"{o:010d} 00000 n \n" for o in offs)
    s += f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{x}\n%%EOF\n"
    open(path, "wb").write(s.encode("latin1"))
pdf(LINES, f"{out}/resume.pdf")
pdf([], f"{out}/blank.pdf")
ct = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
rels = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
body = "".join(f"<w:p><w:r><w:t>{l}</w:t></w:r></w:p>" for l in LINES)
doc = f'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>'
with zipfile.ZipFile(f"{out}/resume.docx", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", ct); z.writestr("_rels/.rels", rels); z.writestr("word/document.xml", doc)
