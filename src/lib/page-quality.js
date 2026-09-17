// No-text pages are classified by a small rendered preview, not by text length alone.
export function hasVisibleInk(pixels){
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]>20&&(pixels[i]<245||pixels[i+1]<245||pixels[i+2]<245))return true;}return false;
}
export function classifyPage(text,visibleInk){
 if(text.trim())return {status:'text',short:text.trim().length<40};
 if(visibleInk===false)return {status:'blank'};
 if(visibleInk===true)return {status:'visual',warning:'Visible content has no selectable text. It may be an image, scanned text or an illustration; it was not included in text-based study materials.'};
 return {status:'unknown',warning:'No selectable text was found and the page preview could not be checked. Open the original page to review it.'};
}
