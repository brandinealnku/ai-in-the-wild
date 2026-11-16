#!/usr/bin/env python3
"""Build citation-aware term vectors for a small, explicitly curated empirical-study corpus.

Uses only OpenAlex singleton work lookups (documented as free). No AI API, no paid
search, no bulk download. Does not store copyrighted abstract/fulltext; only
token frequencies. DOES NOT claim global 'top cited' coverage.
"""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"studies-language.json"
# Source relevance reviewed by title and DOI; citation rank applies WITHIN this list.
DOIS=[
 "10.1093/qje/qjae044",            # Brynjolfsson et al., customer service
 "10.1126/science.adh2586",        # Noy & Zhang, professional writing
 "10.1287/orsc.2025.21838",       # Dell'Acqua et al., consulting
 "10.1287/mnsc.2025.00535",       # Cui et al., developer experiments
 "10.3386/w33795",                # Dillon et al., enterprise use
]
WORD=re.compile(r"[^\W_]+(?:['’-][^\W_]+)*",re.UNICODE)

def now():
 return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def restore_abstract(index):
 if not isinstance(index,dict):return ""
 out=[]
 for word,positions in index.items():
  if not isinstance(word,str) or not isinstance(positions,list):continue
  for p in positions:
   if isinstance(p,int) and 0<=p<25000:out.append((p,word))
 return " ".join(w for _,w in sorted(out))

def word_counts(s):
 return dict(sorted(Counter(w.lower() for w in WORD.findall(s)).items()))

def get_doi(doi):
 url="https://api.openalex.org/works/https://doi.org/"+quote(doi,safe="/")
 request=Request(url,headers={"User-Agent":"AI-in-the-Wild-language-research/0.1 (github.com/brandinealnku/ai-in-the-wild)"})
 with urlopen(request,timeout=22) as response:
  if not response.geturl().startswith("https://api.openalex.org/"):raise ValueError("Unexpected redirect")
  data=response.read(500001)
  if len(data)>500000:raise ValueError("Source record too large")
  work=json.loads(data)
 if work.get("is_retracted"):raise ValueError("Retracted work")
 text=(work.get("display_name") or "")+" "+restore_abstract(work.get("abstract_inverted_index"))
 if len(text.split())<40:raise ValueError("No usable abstract indexed")
 counts=word_counts(text)
 return {"id":work.get("id"),"doi":"https://doi.org/"+doi,
         "title":work.get("display_name"),"journal":(work.get("primary_location") or {}).get("source",{}).get("display_name") if (work.get("primary_location") or {}).get("source") else "Research publication",
         "publicationYear":work.get("publication_year"),"citedByCount":work.get("cited_by_count"),
         "citationCheckedAt":now(),"url":"https://doi.org/"+doi,"textCoverage":"title_and_abstract",
         "tokenCounts":counts,"tokenTotal":sum(counts.values())}

def main():
 previous=json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"studies":[]}
 old={s["doi"]:s for s in previous.get("studies",[]) if s.get("doi")}
 updated=[];errors=[]
 for doi in DOIS:
  try:
   study=get_doi(doi)
   updated.append(study)
   print("OK",doi,study["citedByCount"],"citations")
  except Exception as ex:
   errors.append({"doi":doi,"error":str(ex)[:130]})
   if "https://doi.org/"+doi in old:
    updated.append(old["https://doi.org/"+doi])
   print("WARN",doi,type(ex).__name__,file=sys.stderr)
 if not updated:
  raise SystemExit("No usable indexed studies. Existing data preserved.")
 updated.sort(key=lambda x:(-(x["citedByCount"] or 0),x["title"]))
 payload={"schemaVersion":1,"selection":"Five DOI-identified empirical workplace AI studies selected for relevance, not global citation rank.",
          "rankScope":"citation counts rank only included papers",
          "coverage":"title_and_abstract_only","metadataSource":"OpenAlex singleton DOI lookup",
          "checkedAt":now(),"requestedDOIs":len(DOIS),"studyCount":len(updated),
          "errors":errors,"studies":updated}
 temp=OUT.with_suffix(".json.tmp")
 temp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 temp.replace(OUT)
 print("Saved",len(updated),"study term vectors; raw abstracts are not stored.")

if __name__=="__main__":main()
