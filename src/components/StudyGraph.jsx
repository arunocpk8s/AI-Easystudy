import React,{useId,useMemo,useState,useEffect} from 'react';
import {ZoomIn,ZoomOut,RotateCcw,ChevronLeft,ChevronRight,BookOpen,Check} from 'lucide-react';

function groupTopics(items){
  const grouped=new Map();
  for(const item of items){
    const key=item.title.trim().toLowerCase();
    if(!grouped.has(key))grouped.set(key,{...item,sources:[...item.sources]});
    else {const current=grouped.get(key);current.body+=`\n${item.body}`;current.sources=[...new Set([...current.sources,...item.sources])];}
  }
  return [...grouped.values()];
}
const excerpt=(text,length=130)=>text.length>length?`${text.slice(0,length).trim()}…`:text;
export default function StudyGraph({items,title,type,chunks,onSource}){
  const marker=useId().replaceAll(':','');const [zoom,setZoom]=useState(1);const [page,setPage]=useState(0);const [selected,setSelected]=useState(null);const [reviewed,setReviewed]=useState(new Set());
  const topics=useMemo(()=>groupTopics(items),[items]);
  useEffect(()=>{setPage(0);setSelected(null);setReviewed(new Set());setZoom(1);},[items]);
  const limit=6;const visible=topics.slice(page*limit,(page+1)*limit);const totalPages=Math.ceil(topics.length/limit);
  const roadmap=type==='roadmap';const width=roadmap?850:1120;const height=Math.max(510,visible.length*(roadmap?155:205)+85);
  const nodes=[];const edges=[];
  if(!roadmap){
    const root={id:'root',x:25,y:height/2-65,w:240,h:130,title,tag:'YOUR DOCUMENT',sources:[],body:'Select a topic or evidence node to explore its supporting passages.',kind:'root'};nodes.push(root);
    visible.forEach((topic,i)=>{
      const y=45+i*205;const branch={...topic,id:`topic-${i}`,x:355,y:y+32,w:250,h:125,tag:`TOPIC ${page*limit+i+1}`,kind:'topic'};nodes.push(branch);edges.push({from:root,to:branch});
      const parts=topic.body.split(/(?<=[.!?])\s+|\n+/).filter(s=>s.trim().length>20).slice(0,2);
      (parts.length?parts:[topic.body]).forEach((body,j)=>{const leaf={id:`leaf-${i}-${j}`,x:715,y:y+j*92,w:370,h:80,title:excerpt(body,90),body:topic.body,sources:topic.sources,tag:'SOURCE-LINKED IDEA',kind:'leaf'};nodes.push(leaf);edges.push({from:branch,to:leaf});});
    });
  }else{
    visible.forEach((topic,i)=>{
      const node={...topic,id:`step-${i}`,x:i%2?465:75,y:40+i*155,w:300,h:128,tag:`STEP ${page*limit+i+1}`,kind:'step'};nodes.push(node);if(i)edges.push({from:nodes[i-1],to:node});
    });
  }
  const selectNode=node=>setSelected(node);
  function exportSvg(){const svg=document.getElementById(`graph-${marker}`);const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');const styles=document.createElementNS('http://www.w3.org/2000/svg','style');styles.textContent='.svg-node-content{font-family:Arial,sans-serif;padding:12px;color:#254c70;box-sizing:border-box}.svg-node-content h3{font-size:13px;line-height:1.5;margin:6px 0;font-weight:600}.svg-node-content span{font-size:9px;letter-spacing:.5px;color:#688ca8}.svg-node-content small{font-size:10px;color:#7894a8}.graph-root .svg-node-content,.graph-root .svg-node-content span{color:white}.svg-node-content{width:100%;height:100%}';clone.prepend(styles);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download=`study-${type}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className={`study-graph ${roadmap?'roadmap-graph':'mindmap-graph'}`} aria-label={roadmap?'Graphical study roadmap':'Graphical mind map'}>
    <div className="graph-toolbar"><div><strong>{roadmap?'Your document study path':'Your document at a glance'}</strong><p>{roadmap?'Document-order steps. Prerequisites are not verified.':'Topics connect to source-linked ideas. Select a node to read more.'}</p></div><div className="graph-actions"><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.5,z-.15))}><ZoomOut size={17}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(1.8,z+.15))}><ZoomIn size={17}/></button><button aria-label="Reset graph zoom" onClick={()=>setZoom(1)}><RotateCcw size={15}/></button><button className="svg-export" onClick={exportSvg}>Export SVG</button></div></div>
    <div className="graph-scroll" tabIndex={0} aria-label="Scrollable graph canvas">
      <svg id={`graph-${marker}`} viewBox={`0 0 ${width} ${height}`} style={{width:width*zoom,height:height*zoom}} role="group" aria-label={roadmap?'Connected roadmap steps':'Connected topic hierarchy'}>
        <defs><marker id={`arrow-${marker}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#8eaeca"/></marker></defs>
        {edges.map(({from,to},i)=>{
          const path=roadmap?`M ${from.x+from.w/2} ${from.y+from.h} C ${from.x+from.w/2} ${from.y+from.h+25}, ${to.x+to.w/2} ${to.y-25}, ${to.x+to.w/2} ${to.y-4}`:`M ${from.x+from.w} ${from.y+from.h/2} C ${from.x+from.w+45} ${from.y+from.h/2}, ${to.x-55} ${to.y+to.h/2}, ${to.x-3} ${to.y+to.h/2}`;
          return <path key={i} className="graph-edge" d={path} fill="none" stroke="#aac2d7" strokeWidth="2" markerEnd={`url(#arrow-${marker})`}/>;
        })}
        {nodes.map(node=><g key={node.id} className={`graph-node ${node.kind==='root'?'map-root graph-root':node.kind==='topic'?'map-node':node.kind==='step'?'roadmap-node':'idea-node'} ${selected?.id===node.id?'graph-selected':''}`} transform={`translate(${node.x},${node.y})`} role="button" tabIndex={0} aria-label={`Explore ${node.title}`} onClick={()=>selectNode(node)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(node);}}}>
          <rect width={node.w} height={node.h} rx="12" fill={node.kind==='root'?'#315e83':reviewed.has(node.title)?'#e6f4ea':'#ffffff'} stroke={selected?.id===node.id?'#3b85b8':'#d5e4ef'} strokeWidth="1.5"/>
          <foreignObject x="0" y="0" width={node.w} height={node.h}><div xmlns="http://www.w3.org/1999/xhtml" className="svg-node-content"><span>{node.tag}{reviewed.has(node.title)?' · REVIEWED':''}</span><h3>{excerpt(node.title,node.kind==='leaf'?130:90)}</h3>{node.sources.length>0&&<small>{[...new Set(node.sources.map(id=>chunks.find(c=>c.id===id)?.page).filter(Boolean))].map(p=>`p. ${p}`).join(' · ')}</small>}</div></foreignObject>
        </g>)}
      </svg>
    </div>
    <div className="graph-pagination"><span>{topics.length} topics · Scroll the canvas to explore</span>{totalPages>1&&<div><button aria-label="Previous graph topics" disabled={page===0} onClick={()=>{setPage(p=>p-1);setSelected(null);}}><ChevronLeft size={16}/></button><span>Page {page+1} of {totalPages}</span><button aria-label="Next graph topics" disabled={page===totalPages-1} onClick={()=>{setPage(p=>p+1);setSelected(null);}}><ChevronRight size={16}/></button></div>}</div>
    {selected&&<aside className="graph-inspector"><div className="eyebrow">SELECTED {roadmap?'LEARNING STEP':'TOPIC / IDEA'}</div><h3>{selected.title}</h3><p>{selected.body}</p><div className="source-links">{selected.sources.map(id=>{const chunk=chunks.find(c=>c.id===id);return chunk?<button key={id} onClick={()=>onSource(chunk)}><BookOpen size={12}/> p. {chunk.page}<span>{id}</span></button>:null;})}</div>{roadmap&&<button className="secondary" onClick={()=>setReviewed(previous=>{const next=new Set(previous);if(next.has(selected.title))next.delete(selected.title);else next.add(selected.title);return next;})}><Check size={14}/>{reviewed.has(selected.title)?'Mark as not reviewed':'Mark as reviewed'}</button>}</aside>}
  </section>;
}
