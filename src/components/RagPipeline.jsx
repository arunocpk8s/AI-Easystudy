import React from 'react';
import {ArrowRight,CheckCircle2,Clock3,Info} from 'lucide-react';
const format=ms=>ms==null?'Not measured':ms<1000?`${Math.round(ms)} ms`:`${(ms/1000).toFixed(2)} sec`;
export default function RagPipeline({doc,vectors,trace,busy,progress}){
  const timings=doc?.processing||{};
  const generated=trace?.stages.find(s=>/Generate/.test(s.name));
  const embedded=trace?.kind==='Semantic indexing'?trace.stages[0]:null;
  const stages=[
    {title:'Validate',description:'File type, size and extraction limits',ms:timings.validateMs,status:doc?.demo?'Demo fixture':doc?'Complete':'Waiting for document'},
    {title:'Decode',description:'Extract readable text and page references',ms:timings.decodeMs,status:doc?.demo?'Demo fixture':doc?'Complete':'Waiting for document'},
    {title:'OCR',description:'Printed scanned text · browser-local Tesseract',ms:doc?.ocr?.attempted?timings.ocrMs:null,status:doc?.ocr?(!doc.ocr.enabled?'Disabled for this upload':doc.ocr.attempted?`${doc.ocr.recognized}/${doc.ocr.attempted} pages read · ${doc.ocr.language}`:'Skipped · no image-only pages'):'Available · English / Tamil / Hindi'},
    {title:'Structure',description:'Page headings, topics and source metadata',ms:timings.structureMs,status:doc?'Ready · heuristic headings':'Waiting for document'},
    {title:'Chunk',description:'Page-aware passages with overlap',ms:timings.chunkMs,status:doc?`${doc.chunks.length} passages`:'Waiting for document'},
    {title:'Embed',description:'Text → multilingual vectors, on your device',ms:embedded?.ms,status:vectors?`${vectors.length} vectors ready`:'Optional · enable in Ask this document'},
    {title:'Index',description:'Session-memory passages and optional vectors',ms:timings.indexMs,status:doc?(doc.chunks.length?'Ready · browser session index':'No readable passages'):'Waiting for document'},
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
    <div className="pipeline-summary"><Info size={20}/><div><strong>{busy?progress:doc?.demo?'Demo document loaded — upload your own file to measure preparation.':doc?(doc.chunks.length?'Your document index is ready for this browser session.':'No readable passages were indexed. Inspect page coverage and OCR warnings.'):'Upload a document to start processing.'}</strong><p>Actual time depends on page count, text complexity, model downloads, device speed and API response time. OCR processes printed image-only text locally. Verify transcriptions; table structure, handwriting and diagram interpretation are not supported.</p></div></div>
    <p className="pipeline-reuse">Later questions reuse this session’s index. Retrieval uses BM25, or keyword + multilingual vectors when enabled. Whole-document tools cover every readable chunk in batches. Reranking and persistent Qdrant storage are future improvements.</p>
  </section>;
}
