const el=(tag,cls,text)=>{let x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const text=(target,value)=>document.getElementById(target).textContent=String(value);
const add=(parent,tag,cls,value)=>{let x=el(tag,cls,value);parent.appendChild(x);return x};
const link=(parent,url,label)=>{try{let u=new URL(url);if(u.protocol!=='https:')return;let x=add(parent,'a','ref',label||u.hostname);x.href=u.href;x.target='_blank';x.rel='noopener noreferrer';return x}catch{return null}};
function field(parent,label,value){let d=add(parent,'div','detailbox');add(d,'strong','',label);add(d,'p','line',value||'Not established');return d}
function renderDraft(d){
 const card=add(document.getElementById('drafts'),'section','draft');
 const head=add(card,'div','row');
 add(head,'h2','',d.title||'Untitled candidate');
 add(head,'span','pill',d.status);
 add(card,'p','tiny','Candidate '+d.candidateId+' · '+(d.assessedAt||'')+' · '+d.accessibleSourceCount+' accessible sources');
 const a=d.assessment||{};
 field(card,'Organization / workflow',[(a.organization||'Unknown'),(a.aiWorkflow||'Workflow not established')].join(' — '));
 field(card,'Reported outcome',a.reportedOutcome||'Unknown');
 field(card,'Suggested case summary — NOT VERIFIED',a.suggestedCaseSummary);
 field(card,'Source assessment & limitations',a.sourceAssessment);
 field(card,'Human-review questions',(a.unresolvedQuestions||[]).join('\n'));
 const claims=a.numericClaims||[];
 const claimBox=field(card,'Reported metrics',claims.length?claims.length+' proposed numerical claims':'No numbers supported by retrieved material');
 claims.forEach(c=>{let q=add(claimBox,'div','quote');add(q,'strong','',[(c.claim||''),(c.reportedValue||''),(c.unit||'')].join(' '));add(q,'p','line','Status: '+c.validationStatus+' · Denominator: '+(c.denominator||'unknown')+' · Period: '+(c.period||'unknown'));add(q,'p','line','Exact excerpt: '+c.exactExcerpt);add(q,'p','note',c.limitation)});
 for(const k of ['supportingEvidence','contradictoryEvidence']){
  const box=field(card,k==='supportingEvidence'?'Supporting excerpts':'Potential contradictory excerpts',((a[k]||[]).length?String(a[k].length)+' source passages':'None located; absence is not evidence'));
  (a[k]||[]).forEach(s=>{let q=add(box,'div','quote');add(q,'p','line','['+s.sourceId+'] “'+s.exactExcerpt+'”');add(q,'p','note',s.interpretation)});
 }
 const refs=add(card,'div','detailbox');add(refs,'strong','','Source URLs — manually verify');
 (d.sourceReferences||[]).forEach(s=>{let row=add(refs,'p','line');link(row,s.url,s.sourceId+': '+s.url)});
 let row=add(refs,'p','line');link(row,d.discoveryUrl,'Original discovery pointer');
 const details=add(card,'details');add(details,'summary','','See proposed case record (unapproved)');
 add(details,'pre','',JSON.stringify(d.proposedCase||{},null,2));
}
async function main(){
 try{
  const [a,b]=await Promise.all([fetch('./data/assessment-drafts.json',{cache:'no-store'}),fetch('./data/assessment-health.json',{cache:'no-store'})]);
  if(!a.ok||!b.ok)throw Error('Assessment files not available');
  const [drafts,health]=await Promise.all([a.json(),b.json()]);
  if(!health.publicationBlocked||!Array.isArray(drafts.drafts))throw Error('Invalid review queue');
  text('status','Publication blocked by design');
  text('checked',health.checkedAt?'Last assessment check: '+health.checkedAt:'Assessment not run');
  text('configured',health.aiConfigured?'AI extraction configured':'AI extraction not configured');
  text('count',drafts.drafts.length+' drafts');
  if(!drafts.drafts.length)add(document.getElementById('drafts'),'p','note','No drafts yet. Start the daily discovery workflow from GitHub Actions.');
  else drafts.drafts.forEach(renderDraft);
 }catch(e){text('error','Unable to load assessment queue: '+e.message);text('status','Unavailable')}
}
main();