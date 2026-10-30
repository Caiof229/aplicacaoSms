"""Junta frontend/index.html, o CSS e os JS em um único arquivo (dist/torpedo-demo.html).

Serve para publicar uma demonstração em um lugar que aceita só um arquivo.
No dia a dia você não precisa disso: abra frontend/index.html direto.
Rodar a partir da raiz do projeto:  python tools/build_demo.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "frontend"
html = (FRONT / "index.html").read_text(encoding="utf-8")

head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
head = re.sub(
    r'<link rel="stylesheet" href="(css/[^"]+)">',
    lambda m: f"<style>\n{(FRONT / m.group(1)).read_text(encoding='utf-8')}\n</style>",
    head,
)
body = re.sub(
    r'<script src="(js/[^"]+)"></script>',
    lambda m: f"<script>\n{(FRONT / m.group(1)).read_text(encoding='utf-8')}\n</script>",
    body,
)

saida = ROOT / "dist" / "torpedo-demo.html"
saida.parent.mkdir(exist_ok=True)
saida.write_text('<meta name="claude:viewport-fit-sides" content="cover">\n' + head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
print("Gerado:", saida.relative_to(ROOT))
