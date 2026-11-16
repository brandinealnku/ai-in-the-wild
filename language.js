/* Evidence-linked word counts. No semantic assertions or fabricated article text. */
const A={corpus:"cases",cases:[],studies:[],word:null,metric:"documents",minLength:4,showCommon:false,docs:[],terms:[],sourceLoaded:false,studiesLoaded:false};
const $=id=>document.getElementById(id);
const enc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeURL=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:"#"}catch{return "#"}};
const COMMON=new Set(("a an and are as at be been being but by can could did do does for from had has have if in into is it its may might more most of on or our out over per than that the their them there these they this those through to under up use used using via was were what when where which while who why will with would you your we across about after also all any each one two three four five not no only other some such then therefore within without between among during before since however how into result results study studies case cases ai artificial intelligence generative based company companies reported report reports source sources evidence work workers").split(/\s+/));
const wordRE=/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
function words(s){return String(s||"").toLocaleLowerCase("en").normalize("NFKC").match(wordRE)||[]}
function tally(arr){const m=new Map();for(const t of arr)m.set(t,(m.get(t)||0)+1);return Object.fromEntries(m)}
function docs(){
 if(A.corpus==="studies")return A.studies.filter(x=>x.tokenCounts&&Object.keys(x.tokenCounts).length).map(x=>({
  id:x.id||x.doi,title:x.title,organization:x.journal||"Research paper",url:x.url||x.doi,
  year:x.publicationYear,citations:Number.isInteger(x.citedByCount)?x.citedByCount:null,
  citationDate:x.citationCheckedAt||"",sourceType:"Scholarly title + abstract",
  counts:x.tokenCounts,total:x.tokenTotal||Object.values(x.tokenCounts).reduce((a,b)=>a+b,0),
  description:"Word counts from OpenAlex-indexed title and abstract; not the full article."
 }));
 return A.cases.map(c=>{
  const text=[c.title,c.summary,c.evidence,c.risk,c.apply,c.question].join(" ");
  const ts=words(text);
  return {id:c.id,title:c.title,organization:c.company,url:c.source,year:c.date.slice(0,4),
   citations:null,sourceType:c.source_type||"Case record",outcome:c.outcome,
   counts:tally(ts),total:ts.length,description:c.summary,caseId:c.id};
 });
}
function analyze(){
 A.docs=docs();
 const map=new Map();let total=0;
 for(const d of A.docs){total+=d.total;for(const [word,count] of Object.entries(d.counts)){if(!map.has(word))map.set(word,{word,frequency:0,documents:0});const x=map.get(word);x.frequency+=count;x.documents++}}
 A.terms=[...map.values()].filter(x=>(A.showCommon||!COMMON.has(x.word))&&x.word.length>=A.minLength).sort((a,b)=>b[A.metric]-a[A.metric]||b.frequency-a.frequency||a.word.localeCompare(b.word));
 $("doc-count").textContent=A.docs.length;
 $("vocab-count").textContent=map.size.toLocaleString();
 $("token-count").textContent=total.toLocaleString();
 if(A.word&&!map.has(A.word))A.word=null;
 drawTerms();drawDocuments();
}
function drawTerms(){
 const q=$("term-query").value.trim().toLocaleLowerCase("en");
 const matches=A.terms.filter(x=>!q||x.word.includes(q)).slice(0,80);
 const best=matches[0]?.[A.metric]||1;
 const target=$("terms");
 if(!matches.length){target.innerHTML='<p class="atlas-empty">No matching words. Try shortening the search or changing the word-length filter.</p>';return}
 target.innerHTML=matches.map((x,i)=>'<button class="term-line'+(A.word===x.word?" selected":"")+'" type="button" data-word="'+enc(x.word)+'" aria-pressed="'+String(A.word===x.word)+'"><span class="term-rank">'+String(i+1).padStart(2,"0")+'</span><span class="term-word">'+enc(x.word)+'</span><span class="term-bar"><span style="width:'+Math.round(100*x[A.metric]/best)+'%"></span></span><span class="term-frequency">'+x[A.metric]+'</span></button>').join("");
 target.querySelectorAll("[data-word]").forEach(b=>b.addEventListener("click",()=>{A.word=b.dataset.word;drawTerms();drawDocuments()}));
}
function drawDocuments(){
 const term=A.word;
 const search=$("document-search").value.trim().toLocaleLowerCase("en");
 const match=A.docs.filter(d=>(!term||d.counts[term])&&(!search||[d.organization,d.title,d.description].join(" ").toLocaleLowerCase("en").includes(search)))
  .sort((a,b)=>term?(b.counts[term]||0)-(a.counts[term]||0):A.corpus==="studies"?(b.citations||0)-(a.citations||0):a.organization.localeCompare(b.organization));
 $("selected-title").textContent=term?"“"+term+"”":"Documents in this corpus";
 $("selected-count").textContent=term?match.length+" of "+A.docs.length+" documents":match.length+" documents";
 $("selected-description").textContent=term
  ?"These are exact word matches in the indexed text, not automatic evidence that a study supports a proposition."
  :A.corpus==="studies"?"Citation counts rank only the curated study set shown here. These records include title-and-abstract words only.":"Click a word on the left to reveal all matching curated cases. The index includes published editorial case text, not full external articles.";
 const target=$("document-results");
 if(!match.length){
  const message=A.corpus==="studies"&&!A.docs.length
   ?'The scholarly corpus has not been retrieved yet. Run the manual OpenAlex metadata workflow from the repository. It uses selected DOIs, not an automatic global top-cited claim.'
   :"No documents match this selection.";
  target.innerHTML='<div class="atlas-empty">'+enc(message)+(A.corpus==="studies"?'<p><a href="https://github.com/brandinealnku/ai-in-the-wild/actions/workflows/rebuild-language-corpus.yml" target="_blank" rel="noopener noreferrer">Open literature metadata workflow ↗</a></p>':"")+'</div>';return
 }
 target.innerHTML=match.map(d=>'<article class="word-source"><div class="source-meta"><span>'+enc(d.organization)+'</span><span>'+enc(d.year||"")+'</span></div><h4>'+enc(d.title)+'</h4><div class="source-pills"><span>'+enc(d.sourceType)+'</span>'+(term?'<span>'+d.counts[term]+' uses of “'+enc(term)+'”</span>':"")+(Number.isInteger(d.citations)?'<span>'+d.citations.toLocaleString()+' OpenAlex citations</span>':"")+'</div><p>'+enc(d.description||"")+'</p><a href="'+enc(safeURL(d.url))+'" rel="noopener noreferrer" target="_blank">Read source ↗</a>'+(d.caseId?' <a href="./index.html#explorer" class="case-jump" data-case="'+enc(d.caseId)+'">Open case library ↗</a>':"")+'</article>').join("");
}
function setCorpus(v){A.corpus=v;A.word=null;$("term-query").value="";$("document-search").value="";document.querySelectorAll("[data-corpus]").forEach(b=>{const active=b.dataset.corpus===v;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 $("corpus-title").textContent=v==="cases"?"Editorial case-language analysis":"Citation-aware scholarly language";
 $("corpus-description").textContent=v==="cases"
  ?"Words are counted across the titles, summaries, evidence notes, risks and educational/business questions in the approved case library. This does not include external article bodies."
  :"Selected empirical AI workplace studies; citation counts and title/abstract token frequencies come from OpenAlex when available. Ranked only among the curated studies, not the entire AI literature. No full-text analysis is implied.";
 analyze()}
function exportCSV(){
 const rows=[["word","documents_mentioning","total_occurrences","corpus","text_coverage"],...A.terms.map(x=>[x.word,x.documents,x.frequency,A.corpus,A.corpus==="cases"?"case_editorial_fields":"scholarly_title_and_abstract"])];
 const csv="\uFEFF"+rows.map(r=>r.map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="ai-in-the-wild-"+A.corpus+"-words.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
async function load(){
 const [a,b]=await Promise.allSettled([fetch("./data/cases.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("cases unavailable");return r.json()}),fetch("./data/studies-language.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("literature corpus unavailable");return r.json()})]);
 if(a.status==="fulfilled"&&Array.isArray(a.value.cases))A.cases=a.value.cases.filter(x=>x.review_status==="approved");else $("corpus-description").textContent="Could not load the approved case dataset.";
 if(b.status==="fulfilled"&&Array.isArray(b.value.studies))A.studies=b.value.studies;
 setCorpus("cases");
}
document.querySelectorAll("[data-corpus]").forEach(b=>b.addEventListener("click",()=>setCorpus(b.dataset.corpus)));
$("metric").addEventListener("change",ev=>{A.metric=ev.target.value;analyze()});
$("min-length").addEventListener("change",ev=>{A.minLength=Number(ev.target.value);analyze()});
$("include-common").addEventListener("change",ev=>{A.showCommon=ev.target.checked;analyze()});
$("term-query").addEventListener("input",drawTerms);
$("document-search").addEventListener("input",drawDocuments);
$("clear-word").addEventListener("click",()=>{A.word=null;drawTerms();drawDocuments()});
$("export-terms").addEventListener("click",exportCSV);
const menu=$("menu-button");menu.addEventListener("click",()=>{const nav=document.querySelector(".header-nav");const o=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(o))});
load();