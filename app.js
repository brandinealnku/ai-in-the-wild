let cases=[];
let mode='professional';
const $=id=>document.getElementById(id);
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function options(id,key){const vals=[...new Set(cases.map(c=>c[key]))].sort();$(id).innerHTML='<option value="">All '+(key==='industry'?'industries':'outcomes')+'</option>'+vals.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('')}
function setMode(v){mode=v;document.querySelectorAll('.mode button').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));render()}
function caseHTML(c){const id=cases.indexOf(c);const source2=c.source2?`<a target="_blank" rel="noopener noreferrer" href="${escapeHTML(c.source2)}">Supporting record ↗</a>`:'';
const lesson=mode==='learning'?`<div class="detailbox"><strong>Student discussion question</strong><p>${escapeHTML(c.question)}</p></div>`:`<div class="detailbox"><strong>How to apply this at work</strong><p>${escapeHTML(c.apply)}</p></div>`;
return `<article class="case"><div class="row"><span class="chip">${escapeHTML(c.company)}</span><span class="date">${escapeHTML(c.date)}</span></div><div class="pills"><span class="pill ${escapeHTML(c.outcome)}">${escapeHTML(c.outcome)}</span><span class="pill">${escapeHTML(c.industry)}</span><span class="pill">${escapeHTML(c.function)}</span></div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.summary)}</p><div class="row"><div class="metric">${escapeHTML(c.metric)}<small>${escapeHTML(c.metric_label)}</small></div></div><div class="footer"><span class="tiny">${escapeHTML(c.confidence)}</span><button class="btn" onclick="toggle(${id})" aria-expanded="false" id="b${id}">Explore case ↓</button></div><div class="details" id="d${id}"><div class="detailbox"><strong>Evidence & limitations</strong><p>${escapeHTML(c.evidence)}</p></div><div class="detailbox"><strong>Risk or failure mode</strong><p>${escapeHTML(c.risk)}</p></div>${lesson}<div class="sources"><a target="_blank" rel="noopener noreferrer" href="${escapeHTML(c.source)}">Original source ↗</a>${source2}</div><p style="margin-top:10px;font-size:11px">Source class: ${escapeHTML(c.source_type)} · Reviewed: ${escapeHTML(c.reviewed_at)}</p></div></article>`}
function toggle(i){const d=$('d'+i);const b=$('b'+i);d.classList.toggle('open');b.textContent=d.classList.contains('open')?'Close case ↑':'Explore case ↓';b.setAttribute('aria-expanded',d.classList.contains('open'))}
function render(){const q=$('search').value.toLowerCase().trim(),industry=$('industry').value,outcome=$('outcome').value,sort=$('sort').value;let a=cases.filter(c=>(!industry||c.industry===industry)&&(!outcome||c.outcome===outcome)&&(!q||Object.values(c).some(v=>String(v).toLowerCase().includes(q))));if(sort==='alpha')a.sort((a,b)=>a.company.localeCompare(b.company));else a.sort((a,b)=>b.date.localeCompare(a.date));$('results').innerHTML=a.map(caseHTML).join('');$('count').textContent=a.length+' of '+cases.length+' cases';$('empty').style.display=a.length?'none':'block'}
['search','industry','outcome','sort'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));
async function loadApprovedCases(){
 try{
  const response=await fetch('./data/cases.json',{cache:'no-store'});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const data=await response.json();
  if(data.schemaVersion!==1||!Array.isArray(data.cases))throw new Error('Unexpected data schema');
  const required=['id','company','title','industry','function','outcome','confidence','date','summary','evidence','risk','apply','question','source','reviewed_at'];
  const ids=new Set();
  for(const c of data.cases){
   if(c.review_status!=='approved'||required.some(k=>typeof c[k]!=='string'||!c[k].trim()))throw new Error('Unreviewed or incomplete case in publication dataset');
   if(!['Positive','Mixed','Negative','Unknown'].includes(c.outcome))throw new Error('Unknown outcome label');
   if(!/^https:\/\//.test(c.source))throw new Error('Non-HTTPS source URL');
   if(ids.has(c.id))throw new Error('Duplicate case ID');ids.add(c.id);
  }
  cases=data.cases;options('industry','industry');options('outcome','outcome');
  $('total-cases').textContent=cases.length;
  $('outcome-counts').textContent=['Positive','Mixed','Negative'].map(o=>cases.filter(c=>c.outcome===o).length).join(' / ');
  $('review-date').textContent=new Date(data.reviewedAt+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
  $('footer-date').textContent=data.reviewedAt;
  render();
 }catch(e){$('load-error').hidden=false;$('load-error').textContent='Case data could not be loaded or failed quality checks. '+e.message;}
}
loadApprovedCases();