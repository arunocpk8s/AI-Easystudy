import React from 'react';
import {ArrowRight,CheckCircle2,Clock3,Info} from 'lucide-react';
const format=ms=>ms==null?'Not measured':ms<1000?`${Math.round(ms)} ms`:`${(ms/1000).toFixed(2)} sec`;
export default function RagPipeline({doc,vectors,trace,busy,progress}){
  const timings=doc?.processing||{};
  const generated=trace?.stages.find(s=>/Generate/.test(s.name));
  const embedded=trace?.kind==='Semantic indexing'?trace.stages[0]:null;
  const stages=[
    {title:'Validate',description:'PDF signature, size and page limit',ms:timings.validateMs,status:doc?.demo?'Demo fixture':doc?'Complete':'Waiting for PDF'},
    {title:'Decode',description:'Extract readable text and page references',ms:timings.decodeMs,status:doc?.demo?'Demo fixture':doc?'Complete':'Waiting for PDF'},
    {title:'OCR',description:'Scanned pages need text recognition',status:'Not implemented',unavailable:true},
    {title:'Structure',description:'Page headings, topics and source metadata',ms:timings.structureMs,status:doc?'Ready · heuristic headings':'Waiting for PDF'},
    {title:'Chunk',description:'Page-aware passages with overlap',ms:timings.chunkMs,status:doc?`${doc.chunks.length} passages`:'Waiting for PDF'},
    {title:'Embed',description:'Text → multilingual vectors, on your device',ms:embedded?.ms,status:vectors?`${vectors.length} vectors ready`:'Optional · enable in Ask this PDF'},
    {title:'Index',description:'Session-memory passages and optional vectors',ms:timings.indexMs,status:doc?'Ready · no Qdrant in this build':'Waiting for PDF'},
    {title:'Generate',description:'Study materials and source references',ms:generated?.ms,status:generated?'Completed last request':'Choose a study tool'}
  ];
  return <section className="rag-reference" aria-label="RAG processing pipeline">
    <div className="pipeline-heading"><div><h1>Behind the RAG</h1><p>Follow your document from upload to source-linked study material.</p></div><span className="measurement-label"><Clock3 size={14}/>Measured, not estimated</span></div>
    <div className="pipeline-grid">{stages.map((stage,i)=><article key={stage.title} className={`pipeline-card ${stage.unavailable?'stage-unavailable':''}`}>
      <span className="pipeline-order">STEP {String(i+1).padStart(2,'0')}</span><h2>{i+1}. {stage.title}</h2><p>{stage.description}</p>
      <div className="stage-timing"><span className={`stage-meter ${stage.ms!=null?'measured':''}`}><i/></span><strong>{stage.ms!=null?format(stage.ms):stage.unavailable?'Unavailable':'—'}</strong></div>
      <span className="stage-status">{stage.ms!=null?<CheckCircle2 size={12}/>:<Info size={12}/>} {stage.status}</span>
      {i!==3&&i!==7&&<ArrowRight className="pipeline-arrow" size={17}/>}
    </article>)}</div>
    <div className="pipeline-summary"><Info size={20}/><div><strong>{busy?progress:doc?.demo?'Demo document loaded — upload your own PDF to measure preparation.':doc?'Your document index is ready for this browser session.':'Upload a PDF to start processing.'}</strong><p>Actual time depends on page count, text complexity, model downloads, device speed and API response time. OCR and table/diagram understanding are not available in this build.</p></div></div>
    <p className="pipeline-reuse">Later questions reuse this session’s index. Retrieval uses BM25, or keyword + multilingual vectors when enabled. Whole-document tools cover every readable chunk in batches. Reranking and persistent Qdrant storage are future improvements.</p>
  </section>;
}
