"""Copia as regras de shared/rules.json para o front-end.

O navegador não consegue ler arquivos locais com fetch() quando o index.html
é aberto direto do disco, então geramos um .js com os mesmos dados.
Rode sempre que editar shared/rules.json:  python tools/sync_rules.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "shared" / "rules.json").read_text(encoding="utf-8"))
data.pop("_nota", None)

out = ROOT / "frontend" / "js" / "rules.data.js"
out.write_text(
    "// GERADO por tools/sync_rules.py a partir de shared/rules.json. Não edite à mão.\n"
    f"const RULES_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n",
    encoding="utf-8",
)
print("Gerado:", out.relative_to(ROOT))
