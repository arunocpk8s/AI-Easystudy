import React from 'react';
import {Upload,Network,NotebookText,Layers,AlignLeft,FileQuestion,TriangleAlert,ListChecks,Route,Timer,ArrowUpRight,Trash2,BookOpen} from 'lucide-react';
const tools=[
  {id:'mindmap',label:'Mind map',description:'Topic hierarchy and links',icon:Network},
  {id:'notes',label:'Short notes',description:'Exam-focused key points',icon:NotebookText},
  {id:'flashcards',label:'Flash cards',description:'Visual concept cards · reveal and recall',icon:Layers},
  {id:'summary',label:'Summary',description:'Topic and chapter views',icon:AlignLeft},
  {id:'questions',label:'Question types',description:'Suggested 1, 2, 3, 5-mark practice in AI mode',icon:FileQuestion},
  {id:'confusions',label:'Misconceptions',description:'Potentially confused ideas · review with a teacher',icon:TriangleAlert},
  {id:'quiz',label:'Quiz',description:'Four-option MCQs · feedback and source evidence',icon:ListChecks},
  {id:'roadmap',label:'Study roadmap',description:'Connected learning steps to revision',icon:Route}
];
export default function StudentDashboard({doc,busy,onUpload,onDrop,onGenerate,onAsk,onRemove,classLevel,setClassLevel,subject,setSubject,language,setLanguage}){
  return <section className="student-dashboard" aria-label="Student dashboard">
    <div className="reference-upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)onDrop(e.dataTransfer.files[0]);}}>
      <Upload size={22} className="upload-corner"/>
      <h1>Upload any study PDF</h1>
      <p>Start with a text PDF. Scanned pages need OCR, which is not available yet.</p>
      <div className="document-preferences">
        <label>Class<select aria-label="Class" value={classLevel} disabled={!!busy} onChange={e=>setClassLevel(e.target.value)}><option value="11">Class 11</option><option value="12">Class 12</option><option value="Other">Other</option></select></label>
        <label>Subject<select aria-label="Subject" value={subject} disabled={!!busy} onChange={e=>setSubject(e.target.value)}>{['Physics','Chemistry','Mathematics','Biology','English','History','Geography','Economics','Computer Science','Other'].map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Preferred language<select aria-label="Preferred language" value={language} disabled={!!busy} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Tamil</option><option>Hindi</option></select></label>
      </div>
      <button className="choose-pdf" onClick={onUpload} disabled={!!busy}>Choose PDF</button>
      <small>20 MB maximum · Up to 200 pages · PDF stays on your device</small>
    </div>
    <div className="reference-tools">{tools.map(tool=><button className="reference-tool" key={tool.id} aria-label={`Create ${tool.label}`} disabled={!!busy||!doc} onClick={()=>onGenerate(tool.id)}><tool.icon size={23}/><h2>{tool.label}</h2><p>{tool.description}</p><ArrowUpRight size={16} className="tool-arrow"/></button>)}</div>
    <button className="reference-ask" disabled={!doc} onClick={onAsk}><div><h2>Ask this PDF</h2><p>Answers with supporting page citations. Missing keyword evidence produces a “not found” response; semantic candidates still need relevance checks.</p></div><ArrowUpRight size={21}/></button>
    <div className="revision-row"><Timer size={19}/><div><strong>Last-minute revision</strong><p>A compact final review of the uploaded topics.</p></div><button className="secondary" disabled={!!busy||!doc} onClick={()=>onGenerate('revision')}>Create revision notes</button></div>
    <div className="document-strip"><BookOpen size={22}/><div><strong>{doc?.name||'No document yet'}</strong><p>{doc?`${doc.pages.length} pages · ${doc.chunks.length} searchable passages · ${doc.demo?'Original demo notes':'Browser session only'}`:'Choose a PDF to begin.'}</p></div>{doc&&<button className="text-button" disabled={!!busy} onClick={onRemove}>Remove<Trash2 size={14}/></button>}</div>
    <p className="student-disclaimer">Study materials are generated practice, not official exam predictions. Check formulas, citations and inferred concepts against the PDF.</p>
  </section>;
}
