export const TRANSLATION_MODEL='Xenova/nllb-200-distilled-600M';
export const LANGUAGE_CODES={English:'eng_Latn',Tamil:'tam_Taml'};
// Short segments avoid silently truncating long paragraphs at model input limits.
export function splitTranslationText(text,maxLength=320){
 const parts=[];
 // Translate each sentence independently so a short paragraph is not condensed.
 for(const sentence of text.trim().split(/(?<=[.!?])\s+|\n+/)){
  let remaining=sentence.trim();
  while(remaining.length>maxLength){let at=remaining.lastIndexOf(' ',maxLength-1);if(at<=0)throw new Error('A text token is too long to translate safely.');parts.push(remaining.slice(0,at).trim());remaining=remaining.slice(at+1).trim();}
  if(remaining)parts.push(remaining);
 }return parts;
}
export async function translateStudyItems(items,translate){
 const result=[];
 async function visit(value,key=''){
  // Original quotations, formulas and source identifiers remain exact.
  if(['sources','textbookExcerpt','formula'].includes(key))return structuredClone(value);
  if(typeof value==='string')return ['title','body','text','answer','learningGoal','options'].includes(key)?await translate(value):value;
  if(Array.isArray(value)){const out=[];for(const child of value)out.push(await visit(child,key));return out;}
  if(value&&typeof value==='object'){const out={};for(const [name,child]of Object.entries(value))out[name]=await visit(child,name);return out;}
  return value;
 }
 for(const item of items)result.push({...await visit(item),original:structuredClone(item)});return result;
}

// Project-authored physics terminology aids: not a guarantee of sentence accuracy.
const physicsTerms=new Map([
 ['electric charge','மின்சுமை'],['charge','மின்சுமை'],['electric field','மின்புலம்'],
 ['electric potential','மின்னழுத்தம்'],["coulomb’s law",'கூலூம் விதி'],["coulomb's law",'கூலூம் விதி']
]);
export function terminologyTranslation(text,source,target,subject){
 if(subject!=='Physics')return null;
 if(source==='English'&&target==='Tamil')return physicsTerms.get(text.toLowerCase().replace(/[.!?]$/,'').trim())||null;
 return null;
}
export function prepareTranslationInput(text,source,subject){
 // Give the general translation model electrical context for ambiguous charge/fee vocabulary.
 return source==='English'&&subject==='Physics'?text.replace(/(?<!electric )(?<!electrical )\bcharges?\b/gi,match=>`electric ${match.toLowerCase()}`):text;
}
export function normalizeTranslationTerms(text,source,target,subject){
 if(subject!=='Physics')return text;
 if(source==='English'&&target==='Tamil')return text.replace(/(?:மின்சாரக் |மின்சார |மின் )?கட்டணங்களை/g,'மின்சுமைகளை').replace(/(?:மின்சாரக் |மின்சார |மின் )?கட்டணங்கள்/g,'மின்சுமைகள்').replace(/(?:மின்சாரக் |மின்சார |மின் )?கட்டணம்/g,'மின்சுமை');
 return text;
}
