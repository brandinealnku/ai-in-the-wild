#!/usr/bin/env python3
"""Fail closed: only evidence-reviewed records may reach the public dataset."""
import json, pathlib, datetime, urllib.parse
p=pathlib.Path(__file__).resolve().parents[1]/'data'/'cases.json'
d=json.loads(p.read_text(encoding='utf-8'))
assert d['schemaVersion']==1 and isinstance(d['cases'],list) and d['cases'], 'Invalid dataset'
required=('id','company','title','industry','function','outcome','confidence','date','summary','evidence','risk','apply','question','source','reviewed_at','review_status')
ids=set()
for c in d['cases']:
 assert all(isinstance(c.get(k),str) and c[k].strip() for k in required), f'Missing fields: {c.get("id")}'
 assert c['review_status']=='approved', f'Unreviewed case: {c["id"]}'
 assert c['outcome'] in {'Positive','Mixed','Negative','Unknown'}
 assert urllib.parse.urlsplit(c['source']).scheme=='https'
 assert c['id'] not in ids, f'Duplicate ID: {c["id"]}'
 ids.add(c['id'])
 for field in ('date','reviewed_at'):
  datetime.date.fromisoformat(c[field])
print(f'PASS: {len(ids)} reviewed cases; schema and sources validated')
