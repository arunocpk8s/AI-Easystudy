import {PDFDocument,StandardFonts} from 'pdf-lib';
import {writeFileSync,mkdirSync} from 'node:fs';
const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);
for(const text of ['Electric charge is conserved. Like charges repel. Unlike charges attract.','Electric field is force per unit positive test charge. Its SI unit is N/C.']){
  const page=pdf.addPage([600,400]);page.drawText(text,{x:30,y:320,size:12,font,maxWidth:530});
}
mkdirSync('tests/fixtures',{recursive:true});writeFileSync('tests/fixtures/study.pdf',await pdf.save());
