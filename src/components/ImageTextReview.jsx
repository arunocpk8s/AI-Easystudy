import React,{useState,useEffect} from 'react';
import {ScanText,CheckCircle2} from 'lucide-react';
export default function ImageTextReview({doc,url,busy,onConfirm}){
 const [text,setText]=useState(''),[error,setError]=useState('');
 useEffect(()=>{setText(doc?.pages?.[0]?.text||doc?.pages?.[0]?.ocrDraft||'');setError('');},[doc]);
 if(doc?.format!=='image'||!doc.needsReview)return null;
 function confirm(){try{onConfirm(text);setError('');}catch(e){setError(e.message);}}
 return <section className="image-text-review" aria-label="Review image text"><header><ScanText size={23}/><div><h2>Review the image text first</h2><p>OCR can mistake letters, formulas and handwriting. Compare this draft with your image, correct it, then approve the text for study tools.</p></div></header><div className="image-review-columns"><div><img src={url} alt="Original image for transcription review"/><p>For a poor draft, select the exact printed language and upload a sharp, upright crop. Handwriting and diagrams need manual transcription.</p></div><label>Recognized text — edit corrections<textarea aria-label="Image transcription" value={text} onChange={e=>setText(e.target.value)} maxLength={20000} disabled={!!busy} spellCheck={false}/><small>This draft is not indexed until you approve it. Your corrections become the cited transcription.</small></label></div>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={!!busy} onClick={confirm}><CheckCircle2 size={17}/>Use reviewed text</button></section>;
}
