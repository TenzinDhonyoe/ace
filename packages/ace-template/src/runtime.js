// Client-side runtime for @ace/template-rendered sites.
//
// Exports `runtimeScript()` — returns a string of JavaScript to inline into
// the generated HTML. The runtime handles everything that depends on the
// page being mounted: search palette, progress pill, theme toggle, keyboard
// shortcuts, mobile sidebar, active-section highlighting on scroll.
//
// Each top-level function is also exported directly for unit testing. Tests
// run these against happy-dom without needing to inline the full string.

/** Build a search index from the rendered page DOM.
 *  Returns an array of {kind, id, title, snippet, anchor} entries. */
export function buildSearchIndex(root) {
  if (!root) return [];
  const entries = [];

  // Sections
  root.querySelectorAll("main section[id]").forEach((sec) => {
    const h2 = sec.querySelector(":scope > h2");
    const lede = sec.querySelector(":scope > p.ace-lede");
    if (h2) {
      entries.push({
        kind: "section",
        id: sec.id,
        title: h2.textContent.trim(),
        snippet: lede ? lede.textContent.trim().slice(0, 120) : "",
        anchor: "#" + sec.id,
      });
    }
  });

  // Subtopics
  root.querySelectorAll("main section h3[id]").forEach((h3) => {
    const parentSection = h3.closest("section[id]");
    entries.push({
      kind: "subtopic",
      id: h3.id,
      title: h3.textContent.trim(),
      snippet: parentSection ? parentSection.querySelector("h2")?.textContent.trim() || "" : "",
      anchor: "#" + h3.id,
    });
  });

  // Flashcards (Q + A)
  root.querySelectorAll(".ace-flashcard").forEach((card, i) => {
    const q = card.querySelector(".ace-flashcard__q")?.textContent.trim() || "";
    const a = card.querySelector(".ace-flashcard__a")?.textContent.trim() || "";
    const section = card.closest("section[id]");
    if (q) {
      entries.push({
        kind: "flashcard",
        id: "fc-" + (section?.id || "") + "-" + i,
        title: q,
        snippet: a.slice(0, 120),
        anchor: section ? "#" + section.id : "",
      });
    }
  });

  // MCQ questions
  root.querySelectorAll(".ace-mcq__item").forEach((item, i) => {
    const q = item.querySelector(".ace-mcq__text")?.textContent.trim() || "";
    const section = item.closest("section[id]");
    if (q) {
      entries.push({
        kind: "mcq",
        id: "mcq-" + (section?.id || "") + "-" + i,
        title: q,
        snippet: section?.querySelector("h2")?.textContent.trim() || "",
        anchor: section ? "#" + section.id : "",
      });
    }
  });

  // Concept cards
  root.querySelectorAll(".ace-concept").forEach((card, i) => {
    const q = card.querySelector(".ace-concept__q")?.textContent.trim() || "";
    const a = card.querySelector(".ace-concept__ans")?.textContent.trim() || "";
    const section = card.closest("section[id]");
    if (q) {
      entries.push({
        kind: "concept",
        id: "concept-" + (section?.id || "") + "-" + i,
        title: q.replace(/^⚡ Quick check · /i, ""),
        snippet: a.slice(0, 120),
        anchor: section ? "#" + section.id : "",
      });
    }
  });

  return entries;
}

/** Tiny case-insensitive substring match. Returns entries ranked by
 *  (title match first, snippet second, then by kind weight). */
export function searchIndex(entries, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const kindWeight = { section: 0, subtopic: 1, concept: 2, mcq: 3, flashcard: 4 };
  const scored = [];
  for (const e of entries) {
    const t = e.title.toLowerCase();
    const s = (e.snippet || "").toLowerCase();
    const ti = t.indexOf(q);
    const si = s.indexOf(q);
    if (ti === -1 && si === -1) continue;
    const score = (ti === -1 ? 100 : ti) * 2 + (si === -1 ? 100 : si) + (kindWeight[e.kind] || 9);
    scored.push({ entry: e, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 30).map((s) => s.entry);
}

/** Walk the DOM and count mastery state. Returns {mastered, total}. */
export function computeProgress(root) {
  if (!root) return { mastered: 0, total: 0 };
  const flashcards = Array.from(root.querySelectorAll(".ace-flashcard"));
  const concepts = Array.from(root.querySelectorAll(".ace-concept"));
  const total = flashcards.length + concepts.length;
  const mastered =
    flashcards.filter((c) => c.classList.contains("is-got")).length +
    concepts.filter((c) => c.classList.contains("is-got")).length;
  return { mastered, total };
}

/** Apply a theme. value is "light" | "dark" | "auto" — auto follows OS. */
export function applyTheme(value, doc, storage) {
  doc = doc || (typeof document !== "undefined" ? document : null);
  storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!doc) return;
  const root = doc.documentElement;
  if (value === "dark") root.classList.add("dark");
  else if (value === "light") root.classList.remove("dark");
  else if (value === "auto") {
    const prefersDark = doc.defaultView?.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    root.classList.toggle("dark", !!prefersDark);
  }
  try { storage?.setItem("ace:theme", value); } catch {}
}

/** Load the saved theme (or default to light). */
export function loadTheme(storage) {
  storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  try { return storage?.getItem("ace:theme") || "light"; } catch { return "light"; }
}

/** The string returned from this function is inlined as a <script> in the
 *  rendered HTML. It sets up everything at DOMContentLoaded.
 *  Duplicates the logic above because the rendered page can't import modules
 *  by path — the code has to be bundled into one inline script.
 *
 *  Keep this string under ~15KB. Currently ~10KB. */
export function runtimeScript() {
  return `
(function(){
'use strict';

// ---- Utilities ----------------------------------------------------------
var $ = function(sel, r){ return (r||document).querySelector(sel); };
var $$ = function(sel, r){ return Array.prototype.slice.call((r||document).querySelectorAll(sel)); };
var LS = {
  get: function(k, d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

// ---- Theme toggle --------------------------------------------------------
function applyTheme(t){
  var html=document.documentElement;
  if(t==='dark') html.classList.add('dark');
  else if(t==='light') html.classList.remove('dark');
  else if(t==='auto'){
    html.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);
  }
  try{ localStorage.setItem('ace:theme', t); }catch(e){}
  var btn=$('#themeBtn');
  if(btn) btn.textContent = html.classList.contains('dark') ? '☀' : '☾';
}
function initTheme(){
  var saved='light'; try{ saved=localStorage.getItem('ace:theme')||'light'; }catch(e){}
  applyTheme(saved);
  var btn=$('#themeBtn');
  if(btn) btn.addEventListener('click', function(){
    var next=document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  });
}

// ---- Mobile sidebar ------------------------------------------------------
function initSidebar(){
  var side=$('#side'), backdrop=$('#sideBackdrop'), btn=$('#menuBtn');
  if(!side||!btn) return;
  function open(){ side.classList.add('open'); backdrop&&backdrop.classList.add('open'); }
  function close(){ side.classList.remove('open'); backdrop&&backdrop.classList.remove('open'); }
  btn.addEventListener('click', function(){ side.classList.contains('open')?close():open(); });
  backdrop&&backdrop.addEventListener('click', close);
  side.addEventListener('click', function(e){
    if(e.target.tagName==='A') close();
  });
}

// ---- Active section / subtopic on scroll --------------------------------
function initScrollSpy(){
  if(typeof IntersectionObserver==='undefined') return;
  var sections=$$('main section[id]');
  var subtopics=$$('main section h3[id]');
  var grps=$$('.ace-side .ace-grp');
  var subLinks={};
  grps.forEach(function(g){
    $$(':scope > a', g).forEach(function(a){
      var id=(a.getAttribute('href')||'').replace('#','');
      if(id) subLinks[id]=a;
    });
  });
  var activeSection=null;
  function setActiveSection(id){
    if(activeSection===id) return;
    activeSection=id;
    grps.forEach(function(g){ g.classList.toggle('is-active', g.getAttribute('data-topic')===id); });
  }
  function setActiveSub(id){
    Object.keys(subLinks).forEach(function(k){ subLinks[k].classList.toggle('is-active', k===id); });
  }
  var secObs=new IntersectionObserver(function(entries){
    // Pick the most-in-view entry
    var best=null;
    entries.forEach(function(e){ if(e.isIntersecting && (!best||e.intersectionRatio>best.intersectionRatio)) best=e; });
    if(best) setActiveSection(best.target.id);
  }, { rootMargin: '-30% 0% -55% 0%', threshold: [0, 0.1, 0.5, 1] });
  sections.forEach(function(s){ secObs.observe(s); });
  var subObs=new IntersectionObserver(function(entries){
    var best=null;
    entries.forEach(function(e){ if(e.isIntersecting && (!best||e.intersectionRatio>best.intersectionRatio)) best=e; });
    if(best) setActiveSub(best.target.id);
  }, { rootMargin: '-25% 0% -65% 0%', threshold: [0, 0.1, 0.5, 1] });
  subtopics.forEach(function(h){ subObs.observe(h); });

  // Apply active state synchronously from a target id (section or h3).
  // IntersectionObserver is scroll-driven and lags during smooth-scroll; clicks
  // need to win immediately so the sidebar feels responsive.
  function applyActiveFromTarget(id){
    if(!id) return false;
    var el=document.getElementById(id);
    if(!el) return false;
    var sec=el.closest('section[id]');
    if(sec) setActiveSection(sec.id);
    if(el.tagName==='H3'){ setActiveSub(id); }
    else { // Section-title click — clear all sub-highlights so no stale subtopic appears lit
      Object.keys(subLinks).forEach(function(k){ subLinks[k].classList.remove('is-active'); });
    }
    return true;
  }

  // Sidebar link click: apply active state instantly (don't wait for scroll+IO).
  var side=document.getElementById('side');
  if(side){
    side.addEventListener('click', function(e){
      var a=e.target.closest('a[href^="#"]');
      if(!a) return;
      var id=a.getAttribute('href').replace('#','');
      applyActiveFromTarget(id);
    });
  }
  // Also respond to hash changes (direct URL, keyboard palette Enter, etc).
  window.addEventListener('hashchange', function(){
    applyActiveFromTarget((location.hash||'').replace('#',''));
  });

  // Initial active from hash (or first section).
  var initial=(location.hash||'').replace('#','')||(sections[0]&&sections[0].id);
  applyActiveFromTarget(initial);
}

// ---- Progress pill -------------------------------------------------------
var lastMastered = 0;
function updateProgress(){
  var cards=$$('.ace-flashcard'), concepts=$$('.ace-concept');
  var total=cards.length+concepts.length;
  var got=cards.filter(function(c){ return c.classList.contains('is-got'); }).length
        +concepts.filter(function(c){ return c.classList.contains('is-got'); }).length;
  var txt=$('#progressTxt'), bar=$('#progressBar'), pill=$('#progressPill');
  if(txt) txt.innerHTML='<b>'+got+'</b>/'+total;
  if(bar) bar.style.width=(total?(got/total*100):0)+'%';
  // Pulse on increment
  if(pill && got > lastMastered){
    pill.classList.remove('is-pulse');
    // Force reflow so the animation restarts even on consecutive increments
    void pill.offsetWidth;
    pill.classList.add('is-pulse');
    setTimeout(function(){ pill.classList.remove('is-pulse'); }, 550);
  }
  lastMastered = got;
}
function initProgress(){
  updateProgress();
  // Re-count when any card toggles is-got. Use MutationObserver on main.
  var main=$('main'); if(!main) return;
  new MutationObserver(updateProgress).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  var pill=$('#progressPill');
  pill&&pill.addEventListener('click', function(){
    if(!confirm('Reset all "Got it" marks? This clears your mastery progress.')) return;
    try{
      var keys=[]; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k && k.indexOf('ace:')===0 && k.indexOf(':got')>-1) keys.push(k); }
      keys.forEach(function(k){ localStorage.removeItem(k); });
    }catch(e){}
    location.reload();
  });
}

// ---- Search palette ------------------------------------------------------
function buildIndex(root){
  var entries=[];
  $$('main section[id]', root).forEach(function(sec){
    var h2=sec.querySelector(':scope > h2');
    var lede=sec.querySelector(':scope > p.ace-lede');
    if(h2) entries.push({kind:'section',title:h2.textContent.trim(),snippet:lede?lede.textContent.trim().slice(0,120):'',anchor:'#'+sec.id});
  });
  $$('main section h3[id]', root).forEach(function(h3){
    var sec=h3.closest('section[id]');
    entries.push({kind:'subtopic',title:h3.textContent.trim(),snippet:sec?(sec.querySelector('h2')||{}).textContent||'':'',anchor:'#'+h3.id});
  });
  $$('.ace-flashcard', root).forEach(function(c){
    var q=(c.querySelector('.ace-flashcard__q')||{}).textContent||'';
    var a=(c.querySelector('.ace-flashcard__a')||{}).textContent||'';
    var sec=c.closest('section[id]');
    if(q) entries.push({kind:'flashcard',title:q.trim(),snippet:a.trim().slice(0,120),anchor:sec?'#'+sec.id:''});
  });
  $$('.ace-mcq__item', root).forEach(function(it){
    var q=(it.querySelector('.ace-mcq__text')||{}).textContent||'';
    var sec=it.closest('section[id]');
    if(q) entries.push({kind:'mcq',title:q.trim(),snippet:sec?(sec.querySelector('h2')||{}).textContent.trim():'',anchor:sec?'#'+sec.id:''});
  });
  $$('.ace-concept', root).forEach(function(c){
    var q=(c.querySelector('.ace-concept__q')||{}).textContent||'';
    var a=(c.querySelector('.ace-concept__ans')||{}).textContent||'';
    var sec=c.closest('section[id]');
    if(q) entries.push({kind:'concept',title:q.trim().replace(/^⚡ Quick check · /i,''),snippet:a.trim().slice(0,120),anchor:sec?'#'+sec.id:''});
  });
  return entries;
}
function runSearch(entries, query){
  var q=query.trim().toLowerCase(); if(!q) return [];
  var kindW={section:0,subtopic:1,concept:2,mcq:3,flashcard:4};
  var scored=[];
  for(var i=0;i<entries.length;i++){
    var e=entries[i], t=e.title.toLowerCase(), s=(e.snippet||'').toLowerCase();
    var ti=t.indexOf(q), si=s.indexOf(q);
    if(ti===-1&&si===-1) continue;
    var score=(ti===-1?100:ti)*2+(si===-1?100:si)+(kindW[e.kind]||9);
    scored.push({e:e,score:score});
  }
  scored.sort(function(a,b){ return a.score-b.score; });
  return scored.slice(0,30).map(function(x){ return x.e; });
}
function highlightMatch(text, query){
  if(!query) return text;
  var idx=text.toLowerCase().indexOf(query.toLowerCase());
  if(idx===-1) return text;
  return text.slice(0,idx)+'<em>'+text.slice(idx,idx+query.length)+'</em>'+text.slice(idx+query.length);
}
function initPalette(){
  var palette=$('#palette'), input=$('#paletteInput'), results=$('#paletteResults');
  var openBtn=$('#searchOpen');
  if(!palette||!input||!results) return;
  var index=null;
  var selected=0;
  var lastResults=[];
  function open(){
    if(!index) index=buildIndex(document);
    palette.classList.add('open');
    setTimeout(function(){ input.focus(); input.select(); }, 10);
    render('');
  }
  function close(){ palette.classList.remove('open'); input.value=''; }
  function render(q){
    var r=runSearch(index, q);
    lastResults=r;
    selected=0;
    if(!q){ results.innerHTML='<div class="ace-palette__empty">Type to search sections, flashcards, or quiz questions.</div>'; return; }
    if(!r.length){ results.innerHTML='<div class="ace-palette__empty">No matches for "'+q.replace(/</g,'&lt;')+'".</div>'; return; }
    results.innerHTML=r.map(function(e,i){
      return '<a href="'+e.anchor+'" data-i="'+i+'" class="'+(i===0?'is-sel':'')+'"><span class="ace-palette__tag">'+e.kind+'</span>'+highlightMatch(e.title.replace(/</g,'&lt;'), q)+(e.snippet?'<div class="ace-palette__snip">'+highlightMatch(e.snippet.replace(/</g,'&lt;'), q)+'</div>':'')+'</a>';
    }).join('');
  }
  function updateSel(){
    var links=$$('a',results);
    links.forEach(function(a,i){ a.classList.toggle('is-sel', i===selected); });
    if(links[selected]) links[selected].scrollIntoView({block:'nearest'});
  }
  openBtn&&openBtn.addEventListener('click', open);
  input.addEventListener('input', function(){ render(input.value); });
  input.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); if(lastResults.length){ selected=(selected+1)%lastResults.length; updateSel(); } }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(lastResults.length){ selected=(selected-1+lastResults.length)%lastResults.length; updateSel(); } }
    else if(e.key==='Enter'){
      e.preventDefault();
      if(lastResults[selected]){ location.hash=lastResults[selected].anchor; close(); }
    }
  });
  results.addEventListener('click', function(e){
    var a=e.target.closest('a'); if(a) close();
  });
  palette.addEventListener('click', function(e){ if(e.target===palette) close(); });

  document.addEventListener('keydown', function(e){
    var cmdK=(e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey);
    if(cmdK){ e.preventDefault(); palette.classList.contains('open')?close():open(); }
    else if(e.key==='/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
      e.preventDefault(); open();
    }
  });
}

// ---- Help overlay --------------------------------------------------------
function initHelp(){
  var help=$('#help'), btn=$('#helpBtn');
  if(!help||!btn) return;
  function open(){ help.classList.add('open'); }
  function close(){ help.classList.remove('open'); }
  btn.addEventListener('click', open);
  help.addEventListener('click', function(e){ if(e.target===help) close(); });
  document.addEventListener('keydown', function(e){
    if(e.key==='?' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ e.preventDefault(); help.classList.contains('open')?close():open(); }
    else if(e.key==='Escape' && help.classList.contains('open')) close();
  });
}

// ---- Quiz jump -----------------------------------------------------------
function initQuizJump(){
  var btn=$('#quizJump'); if(!btn) return;
  btn.addEventListener('click', function(){
    var q=document.querySelector('section[id$="quiz"], section[id="final"], section[id="quiz"]');
    if(q) q.scrollIntoView({behavior:'smooth',block:'start'});
  });
}

// ---- Boot ----------------------------------------------------------------
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
function boot(){
  initTheme();
  initSidebar();
  initScrollSpy();
  initProgress();
  initPalette();
  initHelp();
  initQuizJump();
}
})();
`;
}
