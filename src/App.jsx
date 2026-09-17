import React,{useState,useRef,useEffect} from 'react';
import {BookOpen,FileText,Network,Layers,AlignLeft,MessageCircleQuestion,Lightbulb,CircleHelp,Timer,Route,LayoutDashboard,Sparkles,MessagesSquare,Workflow,BookMarked,Plus,ShieldCheck,Settings,ChevronRight,Upload,ArrowUpRight,FileUp,LockKeyhole,Files,ScanText,Link,Trash2,AlertCircle,X,AlertTriangle,Download,ArrowRight,RotateCcw,Search,Check} from 'lucide-react';
import {samplePages} from './lib/sample.js';
import {chunkPages,retrieve,sectionEvidence} from './lib/rag.js';
import {FEATURES,extractiveMaterials} from './lib/materials.js';
import {readPdf} from './lib/pdf.js';
import {embedTexts} from './lib/semantic.js';
import StudentDashboard from './components/StudentDashboard.jsx';
import RagPipeline from './components/RagPipeline.jsx';
import StudyGraph from './components/StudyGraph.jsx';
import StudyNotes from './components/StudyNotes.jsx';
import ArchitectureView from './components/ArchitectureView.jsx';
import {demoMaterials} from './lib/demo-materials.js';
import {structuredPreview,sourceAnswer} from './lib/pedagogy.js';

const iconMap={BookOpen,FileText,Network,Layers,AlignLeft,MessageCircleQuestion,Lightbulb,CircleHelp,Timer,Route,LayoutDashboard,Sparkles,MessagesSquare,Workflow,BookMarked,Plus,ShieldCheck,Settings,ChevronRight,Upload,ArrowUpRight,FileUp,LockKeyhole,Files,ScanText,Link,Trash2,AlertCircle,X,AlertTriangle,Download,ArrowRight,RotateCcw,Search,Check};
const Icon=({name,size=20,...props})=>{const Component=iconMap[name]||BookOpen;return <Component size={size} strokeWidth={1.7} {...props}/>;};
const sample=()=>({name:'Electric charges & fields',pages:samplePages,chunks:chunkPages(samplePages),warnings:[],demo:true,parsingMs:0,chunkingMs:0});
const duration=ms=>ms<1000?`${Math.round(ms)} ms`:`${(ms/1000).toFixed(2)} s`;

export default function App(){
  const [doc,setDoc]=useState(sample);const [view,setView]=useState('dashboard');
  const [selected,setSelected]=useState('notes');const [materials,setMaterials]=useState({});
  const [busy,setBusy]=useState('');const [progress,setProgress]=useState('');const [error,setError]=useState('');
  const [classLevel,setClassLevel]=useState('12');const [subject,setSubject]=useState('Physics');
  const [language,setLanguage]=useState('English');const [mode,setMode]=useState('extractive');
  const [token,setToken]=useState('');const [status,setStatus]=useState({aiConfigured:false});
  const [settings,setSettings]=useState(false);const [source,setSource]=useState(null);
  const [question,setQuestion]=useState('');const [answer,setAnswer]=useState(null);
  const [trace,setTrace]=useState(null);const [vectors,setVectors]=useState(null);
  const [revealed,setRevealed]=useState({});const [responses,setResponses]=useState({});const [submitted,setSubmitted]=useState(false);
  const [url,setUrl]=useState('');const urlRef=useRef('');const fileRef=useRef();
  useEffect(()=>{fetch('/api/status').then(r=>r.json()).then(setStatus).catch(()=>{});return()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current);};},[]);
  useEffect(()=>{
    if(!settings&&!source)return;
    const previous=document.activeElement;
    const dialog=document.querySelector('[role="dialog"]');
    const focusables=()=>Array.from(dialog?.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')||[]);
    focusables()[0]?.focus();
    const handleKey=event=>{
      if(event.key==='Escape'){setSettings(false);setSource(null);}
      if(event.key==='Tab'){
        const elements=focusables();const first=elements[0],last=elements.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',handleKey);
    return()=>{document.removeEventListener('keydown',handleKey);previous?.focus();};
  },[settings,source]);
  const count=doc?.chunks.length||0;
  const current=materials[selected];const feature=FEATURES.find(f=>f.id===selected);

  function changeLanguage(value){setLanguage(value);setError('');if(value==='Tamil'&&!doc?.demo)setMode('ai');}
  function demoSearchQuestion(value){return value.replaceAll('மின்சுமை',' electric charge ').replaceAll('மின்னழுத்தம்',' electric potential ').replaceAll('மின்புலம்',' electric field ').replaceAll('கூலூம்',' Coulomb law ');}
  function resetDocument(value,nextUrl=''){
    if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current=nextUrl;setUrl(nextUrl);
    setDoc(value);setMaterials({});setVectors(null);setAnswer(null);setSource(null);setTrace(null);setRevealed({});setResponses({});setSubmitted(false);
  }
  async function upload(file){
    if(!file)return;setBusy('upload');setError('');setProgress('Opening PDF…');
    try{
      const result=await readPdf(file,(page,total)=>setProgress(`Reading page ${page} of ${total}`));
      resetDocument(result,URL.createObjectURL(file));setView('dashboard');
      setTrace({kind:'Document preparation',stages:[{name:'Extract PDF text',ms:result.parsingMs,detail:`${result.pages.length} pages read`},{name:'Chunk & index',ms:result.chunkingMs,detail:`${result.chunks.length} chunks in session memory`}],evidence:[],mode:'Local PDF processing'});
    }catch(e){setError(e.message);}finally{setBusy('');setProgress('');if(fileRef.current)fileRef.current.value='';}
  }
  async function aiRequest(feature,evidence,q){
    const response=await fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json','x-study-token':token},body:JSON.stringify({feature,language,classLevel,subject,question:q,evidence:evidence.map(({id,page,title,text})=>({id,page,title,text}))})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Generation failed.');return data;
  }
  async function generate(id){
    if(!doc)return;setSelected(id);setView('study');setError('');setSubmitted(false);setRevealed({});setResponses({});
    const key=`${id}:${mode}:${language}:${classLevel}:${subject}`;
    if(materials[id]?.key===key){setTrace({...materials[id].trace,cached:true});return;}
    const effectiveMode=language==='Tamil'&&!doc.demo?'ai':mode;
    if(effectiveMode==='ai'&&!status.aiConfigured){setMode('ai');setError('AI explanations are not enabled in this workspace yet. Open Settings for setup. The bilingual demo is available without AI.');return;}
    if(effectiveMode==='ai'&&!token.trim()){setMode('ai');setSettings(true);setError('Enter your workspace access code in Settings to enable AI explanations.');return;}
    setBusy('generate');setProgress('Preparing study materials…');const started=performance.now();
    try{
      const selectionStart=performance.now();const batches=sectionEvidence(doc.chunks);const selectionMs=performance.now()-selectionStart;const generationStart=performance.now();let items,usage={prompt_tokens:0,completion_tokens:0};let generationMs=0;
      if(effectiveMode==='ai'){
        if(!status.aiConfigured)throw new Error('Configure GROQ_API_KEY and STUDY_ACCESS_TOKEN on the server first.');
        items=[];
        for(let i=0;i<batches.length;i++){
          setProgress(`Generating section ${i+1} of ${batches.length} — all document chunks are covered`);
          const data=await aiRequest(id,batches[i]);items.push(...data.items);generationMs+=data.generationMs;
          usage.prompt_tokens+=data.usage?.prompt_tokens||0;usage.completion_tokens+=data.usage?.completion_tokens||0;
        }
      }else{items=doc.demo?demoMaterials(doc.chunks,id,language):['notes','summary','revision','mindmap','roadmap'].includes(id)?structuredPreview(doc.chunks,id):extractiveMaterials(doc.chunks,id);generationMs=performance.now()-generationStart;}
      const nextTrace={kind:'Study material generation',mode:effectiveMode==='ai'?'AI · structured teaching outputs':doc.demo?'Bilingual demo · manually authored':'Source-based English preview',stages:[{name:'Select document evidence',ms:selectionMs,detail:`All ${count} chunks considered; quiz practice is capped in extractive mode`},{name:'Generate material',ms:generationMs,detail:effectiveMode==='ai'?`${sectionEvidence(doc.chunks).length} model calls`:'No model calls'},{name:'Total request',ms:performance.now()-started,detail:'Measured wall-clock time'}],evidence:doc.chunks,usage};
      setMaterials(previous=>({...previous,[id]:{items,key,mode:effectiveMode==='ai'?'ai':doc.demo?'demo':'extractive',language,trace:nextTrace}}));setTrace(nextTrace);
    }catch(e){setError(e.message);}finally{setBusy('');setProgress('');}
  }
  async function ask(event){
    event.preventDefault();if(!doc||!question.trim())return;setError('');setBusy('ask');setAnswer(null);
    const started=performance.now();setProgress('Finding supporting passages…');
    try{
      const effectiveMode=language==='Tamil'&&!doc.demo?'ai':mode;
      if(effectiveMode==='ai'&&!status.aiConfigured)throw new Error('AI explanations are not enabled in this workspace yet. Open Settings for setup.');
      if(effectiveMode==='ai'&&!token.trim()){setSettings(true);throw new Error('Enter your workspace access code to enable AI explanations.');}
      let searchQuestion=doc.demo?demoSearchQuestion(question):question;let translationMs=0;let translationUsage=null;
      if(effectiveMode==='ai'&&/[\u0B80-\u0BFF]/.test(question)){
        setProgress('Translating your question for textbook search…');const translated=await aiRequest('translate_query',[],question);searchQuestion=translated.query;translationMs=translated.generationMs;translationUsage=translated.usage;
      }
      let queryVector=null;let embeddingMs=0;
      if(vectors){const t=performance.now();[queryVector]=await embedTexts([searchQuestion],undefined,'query');embeddingMs=performance.now()-t;}
      const retrievalStart=performance.now();const evidence=retrieve(doc.chunks,searchQuestion,5,vectors,queryVector);const retrievalMs=performance.now()-retrievalStart;
      let items,usage=null,generationMs=0;
      if(!evidence.length){items=[{title:'Not enough evidence',body:'No matching passages were found. Try a more specific question or enable multilingual semantic search. I cannot support an answer from this document.',sources:[]}];}
      else if(effectiveMode==='ai'){
        setProgress('Writing a source-grounded explanation…');const data=await aiRequest('ask',evidence,question);items=data.items;usage=data.usage;generationMs=data.generationMs;
      }else{
        items=doc.demo&&language==='Tamil'?demoMaterials(doc.chunks,'notes','Tamil').filter(item=>evidence.slice(0,2).some(c=>item.sources.includes(c.id))).map(item=>({title:item.title,body:item.definition.text+'\n'+item.keyPoints.slice(0,3).map(p=>p.text).join('\n'),sources:item.sources})):sourceAnswer(evidence,searchQuestion);
      }
      if(translationUsage){usage={prompt_tokens:(usage?.prompt_tokens||0)+(translationUsage.prompt_tokens||0),completion_tokens:(usage?.completion_tokens||0)+(translationUsage.completion_tokens||0)};}
      setAnswer({items,mode:effectiveMode==='ai'?'ai':doc.demo?'demo':'extractive'});setTrace({kind:'Question answering',mode:vectors?'Hybrid · keyword + multilingual vectors':'Keyword · BM25 baseline',stages:[{name:'Translate query',ms:translationMs,detail:translationMs?searchQuestion:'Not needed'},{name:'Embed question',ms:embeddingMs,detail:vectors?'Multilingual E5':'Skipped in keyword mode'},{name:'Retrieve evidence',ms:retrievalMs,detail:`${evidence.length} matching passages`},{name:'Generate response',ms:generationMs,detail:effectiveMode==='ai'&&evidence.length?'1 model call':'No model call'},{name:'Total request',ms:performance.now()-started,detail:'Measured wall-clock time'}],evidence,usage});
    }catch(e){setError(e.message);}finally{setBusy('');setProgress('');}
  }
  async function enableSemantic(){
    if(!doc)return;setBusy('embed');setError('');const started=performance.now();
    try{const result=await embedTexts(doc.chunks.map(c=>c.text),setProgress);setVectors(result);setTrace({kind:'Semantic indexing',mode:'Browser-local multilingual embeddings',stages:[{name:'Load model & embed chunks',ms:performance.now()-started,detail:`${result.length} vectors; model download included on first use`}],evidence:[]});}
    catch{setError('Embedding model could not load. Check your internet connection. Keyword search remains available.');}
    finally{setBusy('');setProgress('');}
  }
  function exportMaterial(){
    if(!current)return;const text=`# ${feature.label}\n\nDocument: ${doc.name}\nMode: ${current.mode}\n\n`+current.items.map(item=>`## ${item.title}\n\n${item.body}\n\n${[...['definition','formula','example','misconception','textbookExcerpt','checkpoint'].filter(k=>item[k]).map(k=>`**${k}:** ${item[k].text} [${item[k].sources.join(', ')}]`),...(item.keyPoints||[]).map(p=>`- ${p.text} [${p.sources.join(', ')}]`),...(item.subtopics||[]).map(t=>`### ${t.title}\n${t.points.map(p=>`- ${p.text} [${p.sources.join(', ')}]`).join('\n')}`),...(item.learningGoal?[`Learning goal: ${item.learningGoal}`]:[])].join('\n')}\n\nSources: ${item.sources.map(id=>`${id} (PDF page ${doc.chunks.find(c=>c.id===id)?.page})`).join(', ')}${item.answer?`\nAnswer: ${item.answer}`:''}`).join('\n\n');
    const blobUrl=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const anchor=document.createElement('a');anchor.href=blobUrl;anchor.download=`study-${selected}.md`;anchor.click();setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
  }
  function sources(ids){return <div className="source-links">{ids.map(id=>{const c=doc.chunks.find(x=>x.id===id);return c?<button key={id} onClick={()=>setSource(c)}><Icon name="BookOpen" size={12}/> p. {c.page}<span>{id}</span></button>:null;})}</div>;}
  function renderItems(result,isAnswer=false){
    if(!result)return null;
    const id=isAnswer?'answer':selected;
    if(id==='mindmap'||id==='roadmap')return <StudyGraph items={result.items} title={doc.name} type={id} chunks={doc.chunks} language={result.language||language} onSource={setSource}/>;
    if(['notes','summary','revision'].includes(id))return <StudyNotes items={result.items} language={result.language||language} title={feature.label} feature={id} chunks={doc.chunks} onSource={setSource}/>;
    return <div className={`material-grid ${id==='flashcards'?'flashcard-grid':''}`}>{result.items.map((item,i)=><article className={`material-card ${id==='roadmap'?'roadmap-card':''}`} key={i}>
      <div className="item-number">{String(i+1).padStart(2,'0')}{id==='flashcards'&&<span>RECALL CARD</span>}</div><h3>{item.title}</h3>
      {id==='flashcards'?<><button className="reveal" onClick={()=>setRevealed(p=>({...p,[i]:!p[i]}))}>{revealed[i]?'Hide answer':'Reveal answer'}<Icon name="RotateCcw" size={15}/></button>{revealed[i]&&<p>{item.body}</p>}</>:id==='quiz'?<>{item.options?<fieldset className="mcq-options"><legend>Your answer</legend>{item.options.map((option,j)=><label key={j}><input type="radio" name={`quiz-${i}`} value={option} checked={responses[i]===option} disabled={submitted} onChange={()=>setResponses(p=>({...p,[i]:option}))}/>{option}</label>)}</fieldset>:<label className="quiz-label">Your answer<input aria-label={`Answer ${i+1}`} value={responses[i]||''} disabled={submitted} onChange={e=>setResponses(p=>({...p,[i]:e.target.value}))} placeholder="Type your answer…"/></label>}{submitted&&<div className="quiz-feedback"><strong>Suggested answer: {item.answer}</strong><p>{item.body}</p><small>Compare your answer with the source. Automatic semantic grading is not enabled.</small></div>}</>:<p>{item.body}</p>}
      {(id!=='quiz'||submitted)&&sources(item.sources)}
    </article>)}{id==='quiz'&&!submitted&&<button className="primary" onClick={()=>setSubmitted(true)}>Check answers<Icon name="ArrowRight" size={17}/></button>}</div>;
  }

  return <div className="app-shell reference-layout">
    <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('dashboard');}}><span className="brand-mark"><Icon name="BookOpen" size={24}/></span>study<span className="brand-light">atlas</span><span className="brand-dot">.</span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav>{[{id:'dashboard',label:'Overview',icon:'LayoutDashboard'},{id:'study',label:'Study studio',icon:'Sparkles'},{id:'ask',label:'Ask your PDF',icon:'MessagesSquare'},{id:'process',label:'Behind the answer',icon:'Workflow'},{id:'docs',label:'Project guide',icon:'BookMarked'}].map(item=><button key={item.id} className={view===item.id?'nav-item active':'nav-item'} onClick={()=>setView(item.id)}><Icon name={item.icon}/>{item.label}{item.id==='study'&&<span className="nav-badge">9</span>}</button>)}</nav>
      <div className="sidebar-divider"/><div className="workspace-label">CURRENT DOCUMENT</div>
      {doc?<div className="sidebar-doc"><span className="pdf-icon"><Icon name="FileText" size={18}/></span><div><strong>{doc.name}</strong><small>{doc.pages.length} pages · {doc.demo?'Demo document':'Local session'}</small></div></div>:<p className="sidebar-empty">Upload a PDF to begin.</p>}
      <button className="sidebar-upload" onClick={()=>fileRef.current.click()} disabled={!!busy}><Icon name="Plus" size={16}/> Upload a PDF</button>
      <div className="sidebar-bottom"><div className="privacy-note"><Icon name="ShieldCheck" size={18}/><div><strong>Your document, your space</strong><small>PDF processing stays on your device.</small></div></div><button className="profile" onClick={()=>setSettings(true)}><span className="avatar">S</span><span><strong>Student workspace</strong><small>Learning, one topic at a time</small></span><Icon name="Settings" size={17}/></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span className="breadcrumb">Workspace <Icon name="ChevronRight" size={13}/> <strong>{view==='dashboard'?'Overview':view==='study'?'Study studio':view==='ask'?'Ask your PDF':view==='process'?'Behind the answer':'Project guide'}</strong></span><div className="top-actions"><span className="local-status"><i/>{mode==='ai'?'AI mode':'Local-first workspace'}</span><button className="icon-button" aria-label="Settings" onClick={()=>setSettings(true)}><Icon name="Settings" size={19}/></button><span className="avatar small">S</span></div></header>
      <main>
        <div className="reference-view-tabs" role="tablist" aria-label="Workspace views"><button role="tab" aria-selected={view!=='process'} onClick={()=>setView('dashboard')}>Student view</button><button role="tab" aria-selected={view==='process'} onClick={()=>setView('process')}>Behind the RAG</button></div>
        <div className="reference-subnav"><button onClick={()=>setView('dashboard')}>Study tools</button><button onClick={()=>setView('ask')}>Ask this PDF</button><button onClick={()=>setView('docs')}>Visual HLD / LLD</button><span>Class {classLevel} · {subject}</span></div>
        {view!=='dashboard'&&view!=='process'&&<div className="page-heading"><div><div className="eyebrow">MAKE ROOM FOR UNDERSTANDING</div><h1>{view==='dashboard'?'Your next “aha” starts here.':view==='study'?'Less scrolling. More learning.':view==='ask'?'A question is a great place to start.':view==='process'?'See the work behind the answer.':'Built to learn. Documented to explain.'}</h1><p>{view==='dashboard'?'Turn your study material into a clear path forward.':view==='study'?'Source-linked study tools, shaped around your document.':view==='ask'?'Find evidence in your document, then explore the explanation.':view==='process'?'Real stages, real evidence, and measured processing time.':'Architecture, decisions, and a practical operating guide.'}</p></div><button className="primary upload-top" onClick={()=>fileRef.current.click()} disabled={!!busy}><Icon name="Upload" size={17}/> Upload PDF</button></div>}
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" aria-label="Upload PDF file" className="file-input" onChange={e=>upload(e.target.files?.[0])}/>
        {error&&<div className="alert error" role="alert"><Icon name="AlertCircle" size={18}/>{error}<button className="text-button" onClick={()=>setSettings(true)}>Settings</button><button aria-label="Dismiss error" onClick={()=>setError('')}><Icon name="X" size={16}/></button></div>}
        {busy&&<div className="alert progress" role="status"><span className="spinner"/>{progress||'Working…'}<span>Measured timings appear after completion</span></div>}
        {doc?.warnings.length>0&&<div className="alert warning"><Icon name="AlertTriangle" size={18}/><div><strong>Some pages need attention.</strong> {doc.warnings.slice(0,3).join(' ')} {doc.warnings.length>3?`+ ${doc.warnings.length-3} more`:''} OCR and diagram interpretation are not available yet.</div></div>}
        {view==='dashboard'&&<StudentDashboard doc={doc} busy={busy} onUpload={()=>fileRef.current.click()} onDrop={upload} onGenerate={generate} onAsk={()=>setView('ask')} onRemove={()=>resetDocument(null)} classLevel={classLevel} setClassLevel={setClassLevel} subject={subject} setSubject={setSubject} language={language} setLanguage={changeLanguage}/>}
        {view==='study'&&<><div className="studio-controls"><div className="tool-tabs">{FEATURES.map(f=><button key={f.id} className={selected===f.id?'selected':''} onClick={()=>{setSelected(f.id);setSubmitted(false);setRevealed({});setResponses({});}} disabled={!!busy}><Icon name={f.icon} size={15}/>{f.label}</button>)}</div><div className="generation-controls"><label>Output language<select value={language} disabled={!!busy} onChange={e=>changeLanguage(e.target.value)}><option>English</option><option>Tamil</option></select></label><label>Generation mode<select value={mode} disabled={!!busy} onChange={e=>setMode(e.target.value)}><option value="extractive">Source preview / demo</option><option value="ai">AI explanations</option></select></label><button className="primary" disabled={!!busy||!doc} onClick={()=>generate(selected)}><Icon name="Sparkles" size={16}/>{current?'Regenerate / open':'Create material'}</button>{current&&<button className="secondary" onClick={exportMaterial}><Icon name="Download" size={16}/> Export</button>}</div></div>
          <div className="section-heading"><div><h2>{feature.label}</h2><p>{current?`${current.mode==='ai'?'AI-generated — review accuracy':current.mode==='demo'?'Bilingual demo — manually authored':'Source-based English preview — not AI-generated'} · ${current.items.length} items · ${doc.name}`:'Select your settings and create this study material.'}</p></div>{current&&<button className="text-button" onClick={()=>setView('process')}>See process<Icon name="ArrowRight" size={15}/></button>}</div>
          {current?renderItems(current):<div className="empty-state"><Icon name={feature.icon} size={36}/><h3>A fresh way to study your document</h3><p>{feature.description}. Create your first set above.</p></div>}
        </>}
        {view==='ask'&&<><div className="ask-layout"><section className="ask-panel"><span className="tool-icon tone-0"><Icon name="MessagesSquare" size={25}/></span><h2>What would you like to understand?</h2><p>Keep your question specific. Every response starts with evidence from your current document.</p><form onSubmit={ask}><textarea value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1000} placeholder="e.g. How is electric potential different from electric field?" aria-label="Question" required/><div className="ask-settings"><select aria-label="Answer mode" value={mode} onChange={e=>setMode(e.target.value)}><option value="extractive">Source-based answer</option><option value="ai">AI explanation</option></select><select aria-label="Answer language" value={language} onChange={e=>changeLanguage(e.target.value)}><option>English</option><option>Tamil</option></select><button className="primary" disabled={!!busy||!doc}>Find an answer<Icon name="ArrowRight" size={16}/></button></div></form><div className="example-prompts">{['What is electric charge?','Explain Coulomb’s law','Compare field and potential'].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}<Icon name="ArrowUpRight" size={13}/></button>)}</div></section><aside className="search-panel"><Icon name="Search" size={24}/><h3>Your search engine</h3><p>{vectors?'Hybrid keyword and multilingual semantic retrieval is active.':'Keyword retrieval is active. Enable semantic search for meaning-based and multilingual retrieval.'}</p><button className="secondary" disabled={!!busy||!!vectors||!doc} onClick={enableSemantic}>{vectors?'Semantic search enabled':'Enable semantic search'}</button><small>First use downloads an embedding model. Processing runs locally and may take time. Tamil ranking is still limited; review the retrieved sources.</small></aside></div>{answer&&<><div className="section-heading"><h2>{answer.mode==='ai'?'Grounded response':answer.mode==='demo'?'Demo / source-based answer':'Source-based answer'}</h2><button className="text-button" onClick={()=>setView('process')}>Inspect retrieval<Icon name="ArrowRight" size={15}/></button></div>{renderItems(answer,true)}</>}</>}
        {view==='process'&&<><RagPipeline doc={doc} vectors={vectors} trace={trace} busy={busy} progress={progress}/>
{trace?<><div className="section-heading"><div><h2>{trace.kind}</h2><p>{trace.mode}{trace.cached?' · Reused cached material; timings are from the original generation':''}</p></div><span className="subtle-badge">Observed measurements</span></div><div className="timeline">{trace.stages.map((s,i)=><div className="timeline-stage" key={i}><span className="stage-check"><Icon name="Check" size={16}/></span><div><h3>{s.name}</h3><p>{s.detail}</p></div><strong>{duration(s.ms)}</strong></div>)}</div>{trace.usage&&<div className="token-stats"><span>Input tokens <strong>{trace.usage.prompt_tokens||0}</strong></span><span>Output tokens <strong>{trace.usage.completion_tokens||0}</strong></span><span>Cost <strong>Not calculated</strong><small>Use current provider pricing</small></span></div>}<div className="section-heading"><h2>Evidence used</h2><span>{trace.evidence.length} passages</span></div><div className="evidence-list">{trace.evidence.map(c=><details key={c.id}><summary><span className="evidence-id">{c.id}</span>{c.title}<span>Page {c.page}{c.score?` · score ${c.score.toFixed(3)}`:''}</span></summary><p>{c.text}</p><button className="text-button" onClick={()=>setSource(c)}>Open source<Icon name="ArrowUpRight" size={14}/></button></details>)}</div></>:<div className="empty-state"><Icon name="Workflow" size={38}/><h3>Your next action will appear here</h3><p>Upload a PDF, create study materials, or ask a question to inspect the measured process.</p></div>}</>}
        {view==='docs'&&<ArchitectureView/>}
        <footer><span className="footer-brand">studyatlas.</span><span>Understand deeply. Revise confidently.</span><span>Always check the source.</span></footer>
      </main>
    </div>
    {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><section className="modal" role="dialog" aria-modal="true" aria-label="Workspace settings" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close settings" onClick={()=>setSettings(false)}><Icon name="X"/></button><span className="tool-icon tone-0"><Icon name="Settings"/></span><h2>Workspace settings</h2><p>AI status: <strong>{status.aiConfigured?'Configured':'Not configured'}</strong></p><label>Workspace access token<input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" placeholder="Enter the server workspace token"/></label><p className="settings-note">The token stays in memory. AI mode sends selected extracted text to Groq through the server. The original PDF remains local. Owner setup: copy .env.example to .env.local, set GROQ_API_KEY and STUDY_ACCESS_TOKEN, then restart the server; on Vercel use project environment variables. Never enter the provider API key here.</p><button className="primary" onClick={()=>{if(status.aiConfigured&&token.trim())setMode('ai');setSettings(false);setError('');}}>Save for this session<Icon name="Check" size={16}/></button><button className="text-button" disabled={!!busy} onClick={()=>{resetDocument(sample());setMode('extractive');setError('');setSettings(false);}}>Load demo notes</button></section></div>}
    {source&&<div className="modal-backdrop" onClick={()=>setSource(null)}><section className="source-modal" role="dialog" aria-modal="true" aria-label="Source evidence" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close source" onClick={()=>setSource(null)}><Icon name="X"/></button><div className="eyebrow">SOURCE EVIDENCE · {source.id}</div><h2>{source.title}</h2><p className="source-meta">{doc.name} · PDF page {source.page}</p><blockquote>{source.text}</blockquote>{url?<><a className="text-button" href={`${url}#page=${source.page}`} target="_blank" rel="noreferrer">Open original PDF page<Icon name="ArrowUpRight" size={15}/></a><iframe title={`PDF page ${source.page}`} src={`${url}#page=${source.page}`} /></>:<p className="settings-note">This is an original demo passage. Upload a PDF to view original pages.</p>}</section></div>}
  </div>;
}
