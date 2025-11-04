import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Handle, Position, addEdge, useNodesState, useEdgesState, MarkerType, ConnectionMode, updateEdge } from "reactflow";
import "reactflow/dist/style.css";
import { Play, Pause, Database, Cable, Server, MessageSquare, Network, Send, Settings, Zap, Code2, BadgeCheck, Users, Clock3 } from "lucide-react";
import arquitecturaData from './arquitectura.json';

const GlobalStyles = () => (<style>{`@keyframes pulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}.pulse-dot{animation:pulse 1.5s ease-in-out infinite}`}</style>);

const handlePosMap: Record<string, Position> = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const ALL_SIDES = ["top","right","bottom","left"] as const;

const palette = { channels:{bg:"linear-gradient(135deg, rgba(16,185,129,.08), rgba(34,211,238,.08))",border:"rgba(16,185,129,.35)",pillBg:"rgba(16,185,129,.15)",pillBorder:"rgba(16,185,129,.35)",iconBg:"rgba(16,185,129,.18)"}, hook:{bg:"linear-gradient(135deg, rgba(14,165,233,.10), rgba(99,102,241,.10))",border:"rgba(14,165,233,.35)",pillBg:"rgba(14,165,233,.15)",pillBorder:"rgba(14,165,233,.35)",iconBg:"rgba(14,165,233,.20)"}, kafka:{bg:"linear-gradient(135deg, rgba(245,158,11,.10), rgba(249,115,22,.10))",border:"rgba(245,158,11,.35)",pillBg:"rgba(245,158,11,.15)",pillBorder:"rgba(245,158,11,.35)",iconBg:"rgba(245,158,11,.20)"}, incoming:{bg:"linear-gradient(135deg, rgba(217,70,239,.10), rgba(236,72,153,.10))",border:"rgba(217,70,239,.35)",pillBg:"rgba(217,70,239,.15)",pillBorder:"rgba(217,70,239,.35)",iconBg:"rgba(217,70,239,.20)"}, flow:{bg:"linear-gradient(135deg, rgba(99,102,241,.10), rgba(168,85,247,.10))",border:"rgba(99,102,241,.35)",pillBg:"rgba(99,102,241,.15)",pillBorder:"rgba(99,102,241,.35)",iconBg:"rgba(99,102,241,.20)"}, outgoing:{bg:"linear-gradient(135deg, rgba(132,204,22,.10), rgba(16,185,129,.10))",border:"rgba(132,204,22,.35)",pillBg:"rgba(132,204,22,.15)",pillBorder:"rgba(132,204,22,.35)",iconBg:"rgba(132,204,22,.20)"}, projector:{bg:"linear-gradient(135deg, rgba(244,63,94,.10), rgba(217,70,239,.10))",border:"rgba(244,63,94,.35)",pillBg:"rgba(244,63,94,.15)",pillBorder:"rgba(244,63,94,.35)",iconBg:"rgba(244,63,94,.20)"}, read:{bg:"linear-gradient(135deg, rgba(6,182,212,.10), rgba(20,184,166,.10))",border:"rgba(6,182,212,.35)",pillBg:"rgba(6,182,212,.15)",pillBorder:"rgba(6,182,212,.35)",iconBg:"rgba(6,182,212,.20)"}, bff:{bg:"linear-gradient(135deg, rgba(14,165,233,.10), rgba(34,197,94,.10))",border:"rgba(14,165,233,.35)",pillBg:"rgba(14,165,233,.15)",pillBorder:"rgba(14,165,233,.35)",iconBg:"rgba(14,165,233,.20)"}, web:{bg:"linear-gradient(135deg, rgba(99,102,241,.10), rgba(236,72,153,.10))",border:"rgba(99,102,241,.35)",pillBg:"rgba(99,102,241,.15)",pillBorder:"rgba(99,102,241,.35)",iconBg:"rgba(99,102,241,.20)"}, close:{bg:"linear-gradient(135deg, rgba(249,115,22,.10), rgba(244,63,94,.10))",border:"rgba(249,115,22,.40)",pillBg:"rgba(249,115,22,.15)",pillBorder:"rgba(249,115,22,.40)",iconBg:"rgba(249,115,22,.22)"} } as const;

function getDbStyle(label?: string){ const L=String(label||"").toLowerCase(); if(L.includes("conversation"))return{bg:"rgba(14,165,233,.14)",border:"rgba(14,165,233,.40)",text:"#0f172a"}; if(L.includes("config"))return{bg:"rgba(100,116,139,.14)",border:"rgba(100,116,139,.40)",text:"#0f172a"}; if(L.includes("flow"))return{bg:"rgba(168,85,247,.14)",border:"rgba(168,85,247,.40)",text:"#0f172a"}; if(L.includes("read model"))return{bg:"rgba(20,184,166,.14)",border:"rgba(20,184,166,.40)",text:"#0f172a"}; if(L.includes("redis"))return{bg:"rgba(239,68,68,.14)",border:"rgba(239,68,68,.40)",text:"#0f172a"}; return{bg:"rgba(203,213,225,.18)",border:"rgba(203,213,225,.50)",text:"#0f172a"}; }

const cardBase: React.CSSProperties = { position:"relative", borderRadius:16, boxShadow:"0 6px 20px rgba(0,0,0,.08)", backdropFilter:"blur(2px)", padding:12, width:260, borderWidth:1, borderStyle:"solid" };
const row: React.CSSProperties = { display:"flex", alignItems:"start", gap:8 };
const iconWrapBase: React.CSSProperties = { padding:8, borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,.06)" };
const titleStyle: React.CSSProperties = { fontWeight:700, lineHeight:1.1, color:"#0f172a" };
const subtitleStyle: React.CSSProperties = { fontSize:12, color:"#475569", marginTop:2 };
const badgeRow: React.CSSProperties = { display:"flex", flexWrap:"wrap", gap:6, marginTop:8 };
const badgeBase: React.CSSProperties = { display:"inline-flex", alignItems:"center", gap:6, fontSize:10, borderRadius:999, padding:"2px 8px", borderWidth:1, borderStyle:"solid" };

function BoxNode({ data }: { data:any }){ const { icon, title, subtitle, dbs=[], techs=[], handles={ in:Array.from(ALL_SIDES), out:Array.from(ALL_SIDES) }, theme="flow", sections=[], cardWidth }=data||{}; const t=(palette as any)[theme]||(palette as any).flow; const inSides=Array.from(new Set([...(handles.in||[]),...ALL_SIDES])); const outSides=Array.from(new Set([...(handles.out||[]),...ALL_SIDES])); const width=typeof cardWidth==="number"?cardWidth:260; const sectionsCols=width>=340&&Array.isArray(sections)&&sections.length>1?2:1; return(<div style={{...cardBase,background:t.bg,borderColor:t.border,width}}><div style={row}><div style={{...iconWrapBase,background:t.iconBg}}>{icon}</div><div style={{minWidth:0}}><div style={titleStyle}>{title}</div>{subtitle&&<div style={subtitleStyle}>{subtitle}</div>}{dbs.length>0&&(<div style={badgeRow}>{dbs.map((name:string)=>{const s=getDbStyle(name);return(<span key={String(name)} style={{...badgeBase,background:s.bg,borderColor:s.border,color:s.text}}><Database size={12}/> {name}</span>);})}</div>)}{techs.length>0&&(<div style={badgeRow}>{techs.map((name:string)=>(<span key={String(name)} style={{...badgeBase,background:t.pillBg,borderColor:t.pillBorder}}><Code2 size={12}/> {name}</span>))}</div>)}</div><span className="pulse-dot" style={{position:"absolute",right:8,top:8,width:8,height:8,borderRadius:8,background:"#22c55e"}}/></div>{Array.isArray(sections)&&sections.length>0&&(<div style={{display:"grid",gridTemplateColumns:sectionsCols===2?"1fr 1fr":"1fr",gap:8,marginTop:10}}>{sections.map((s:any,idx:number)=>(<div key={idx} style={{border:`1px solid ${t.pillBorder}`,background:t.pillBg,borderRadius:10,padding:8,wordBreak:"break-word"}}><div style={{display:"flex",alignItems:"center",gap:6,fontWeight:600}}><span style={{...iconWrapBase,background:"rgba(0,0,0,.05)",boxShadow:"none",padding:6}}>{s.icon}</span><span style={{fontSize:12}}>{s.title}</span></div>{s.subtitle&&<div style={{fontSize:11,color:"#475569",marginTop:4}}>{s.subtitle}</div>}</div>))}</div>)}{inSides.map((p)=>(<Handle key={`in-${p}`} id={`in-${p}`} type="target" position={handlePosMap[p as string]} style={{width:8,height:8,background:"#6366f1"}}/>))}{outSides.map((p)=>(<Handle key={`out-${p}`} id={`out-${p}`} type="source" position={handlePosMap[p as string]} style={{width:8,height:8,background:"#6366f1"}}/>))}</div>); }

function ChannelsNode(){ const t=(palette as any).channels; return(<div style={{...cardBase,background:t.bg,borderColor:t.border}}><div style={{...row,alignItems:"center"}}><div style={{...iconWrapBase,background:t.iconBg}}><MessageSquare size={24}/></div><div><div style={titleStyle}>Canales</div><div style={subtitleStyle}>Meta · WhatsApp · FB · IG</div></div></div><Handle id="in-left" type="target" position={Position.Left} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="out-left" type="source" position={Position.Left} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="in-right" type="target" position={Position.Right} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="out-right" type="source" position={Position.Right} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="in-top" type="target" position={Position.Top} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="out-top" type="source" position={Position.Top} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="in-bottom" type="target" position={Position.Bottom} style={{width:8,height:8,background:"#06b6d4"}}/><Handle id="out-bottom" type="source" position={Position.Bottom} style={{width:8,height:8,background:"#06b6d4"}}/></div>); }

const nodeTypes = { box: BoxNode, channels: ChannelsNode } as const;

// Función para agregar íconos basándose en el ID del nodo
const addIconsToNodes = (nodes: any[]) => {
  const iconMap: Record<string, any> = {
    hook: <Cable size={24}/>,
    kafka: <Network size={24}/>,
    incoming: <Server size={24}/>,
    flow: <Server size={24}/>,
    outgoing: <Send size={24}/>,
    projector: <Zap size={24}/>,
    readmodel: <Database size={24}/>,
    bff: <Server size={24}/>,
    web: <Code2 size={24}/>,
    closeticket: <BadgeCheck size={24}/>
  };

  return nodes.map(node => {
    if (node.type === 'box' && node.data) {
      const newData = { ...node.data };
      
      // Agregar ícono principal
      if (iconMap[node.id]) {
        newData.icon = iconMap[node.id];
      }
      
      // Agregar íconos a las secciones
      if (newData.sections) {
        newData.sections = newData.sections.map((section: any) => {
          let sectionIcon = <MessageSquare size={14}/>;
          
          if (section.title?.includes('gRPC')) sectionIcon = <Server size={14}/>;
          else if (section.title?.includes('Worker')) sectionIcon = <Settings size={14}/>;
          else if (section.title?.includes('Outbox') || section.title?.includes('Relay')) sectionIcon = <Zap size={12}/>;
          else if (section.title?.includes('AutoClose')) sectionIcon = <Clock3 size={12}/>;
          else if (section.title?.includes('Reassign')) sectionIcon = <Users size={12}/>;
          else if (section.title?.includes('Manual') && section.title?.includes('Close')) sectionIcon = <BadgeCheck size={12}/>;
          
          return { ...section, icon: sectionIcon };
        });
      }
      
      return { ...node, data: newData };
    }
    return node;
  });
};

export default function ArquitecturaReactFlow(){
  const [animated,setAnimated]=useState(true);
  const [showDebug,setShowDebug]=useState(false); // Ocultar sanity checks por defecto
  
  const initialNodes = useMemo(() => addIconsToNodes(arquitecturaData.nodes), []);
  const initialEdges = useMemo(() => arquitecturaData.edges.map(edge => ({ 
    ...edge, 
    animated,
    markerEnd: { ...edge.markerEnd, type: MarkerType.ArrowClosed }
  })), [animated]);



  const [nodes,setNodes,onNodesChange]=useNodesState(initialNodes);
  const [edges,setEdges,onEdgesChange]=useEdgesState(initialEdges);

  const onEdgeUpdate=useCallback((oldEdge:any,newConn:any)=>{ setEdges((eds)=>updateEdge(oldEdge,{...newConn,animated:oldEdge.animated,type:oldEdge.type,markerEnd:oldEdge.markerEnd,style:oldEdge.style},eds)); },[setEdges]);
  const onConnect=useCallback((connection:any)=>setEdges((eds)=>addEdge({...connection,animated,type:"smoothstep",markerEnd:{type:MarkerType.ArrowClosed},style:{strokeWidth:2}},eds)),[animated,setEdges]);

  const toggleAnim=()=>{ setEdges((eds)=>eds.map((e)=>({...e,animated:!animated}))); setAnimated((a)=>!a); };
  const exportJSON = () => {
    // Extraer solo las propiedades esenciales para evitar referencias circulares
    const cleanNodes = nodes.map(({ id, type, position, data }) => {
      // Eliminar cualquier propiedad que sea un elemento React (como icon o sections.icon)
      if (!data) return { id, type, position, data };
      const { icon, sections, ...rest } = data;
      let cleanSections = undefined;
      if (Array.isArray(sections)) {
        cleanSections = sections.map((s) => {
          const { icon: sectionIcon, ...sectionRest } = s || {};
          return sectionRest;
        });
      }
      return { id, type, position, data: { ...rest, ...(cleanSections ? { sections: cleanSections } : {}) } };
    });
    const cleanEdges = edges.map(({ id, source, sourceHandle, target, targetHandle, label, labelStyle, type, animated, markerEnd, style, updatable }) => ({ id, source, sourceHandle, target, targetHandle, label, labelStyle, type, animated, markerEnd, style, updatable }));
    const json = JSON.stringify({ nodes: cleanNodes, edges: cleanEdges }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arquitectura-reactflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const resetLayout=()=>{ setNodes(addIconsToNodes(arquitecturaData.nodes)); setEdges(arquitecturaData.edges.map(edge => ({ 
    ...edge, 
    animated,
    markerEnd: { ...edge.markerEnd, type: MarkerType.ArrowClosed }
  }))); };

  const debugFindings=useMemo(()=>{ const findings:string[]=[]; const nodeMap=new Map(nodes.map((n)=>[n.id,n])); edges.forEach((e)=>{ if(!nodeMap.has(e.source))findings.push(`Edge ${e.id}: source '${e.source}' no existe`); if(!nodeMap.has(e.target))findings.push(`Edge ${e.id}: target '${e.target}' no existe`); }); const getHandles=(n:any)=>(n&&n.data&&n.data.handles)||{in:[],out:[]}; edges.forEach((e)=>{ const s=nodeMap.get(e.source as string) as any; const t=nodeMap.get(e.target as string) as any; const sh=(e as any).sourceHandle as string|undefined; const th=(e as any).targetHandle as string|undefined; const sHandles=getHandles(s); const tHandles=getHandles(t); if(s&&s.type!=="channels"&&sh){ const side=String(sh).replace(/^out-/,''); if(!sHandles.out||!sHandles.out.includes(side))findings.push(`Edge ${e.id}: sourceHandle '${sh}' no existe en '${e.source}'`); } if(t&&t.type!=="channels"&&th){ const side=String(th).replace(/^in-/,''); if(!tHandles.in||!tHandles.in.includes(side))findings.push(`Edge ${e.id}: targetHandle '${th}' no existe en '${e.target}'`); } }); const reqTechs=[ {id:"incoming",req:[".NET 10"]},{id:"flow",req:[".NET 10"]},{id:"hook",req:[".NET 10"]},{id:"outgoing",req:[".NET 10"]},{id:"projector",req:[".NET 10"]},{id:"bff",req:["Node 22","NestJS"]},{id:"web",req:["React"]},{id:"closeticket",req:[".NET 10"]} ]; reqTechs.forEach(({id,req})=>{ const n=nodeMap.get(id as string) as any; const techs=(n&&n.data&&n.data.techs)||[]; req.forEach((r)=>{ if(!techs.includes(r))findings.push(`Nodo '${id}' debería declarar tech '${r}'`); }); }); nodes.forEach((n:any)=>{ if(n.type==="box"){ const h=(n&&n.data&&n.data.handles)||{in:[],out:[]}; const okIn=(ALL_SIDES as readonly string[]).every((s)=>h.in&&h.in.includes(s)); const okOut=(ALL_SIDES as readonly string[]).every((s)=>h.out&&h.out.includes(s)); if(!okIn||!okOut)findings.push(`Nodo '${n.id}' no expone 4 frentes en '${!okIn?"in":"out"}'`); } }); const e3=edges.find((e)=>e.id==="e3"); if(!e3||(e3 as any).sourceHandle!=="out-bottom"||(e3 as any).targetHandle!=="in-right"||e3.source!=="kafka"||e3.target!=="incoming")findings.push("Edge e3 debe conectar Kafka(out-bottom) → Incoming(in-right)"); const e6=edges.find((e)=>e.id==="e6"); if(!e6||(e6 as any).sourceHandle!=="out-left"||(e6 as any).targetHandle!=="in-right"||e6.source!=="outgoing"||e6.target!=="channels")findings.push("Edge e6 debe conectar Outgoing(out-left) → Canales(in-right)"); const e11=edges.find((e)=>e.id==="e11"); if(!e11||e11.source!=="bff"||e11.target!=="readmodel"||(e11 as any).sourceHandle!=="out-left"||(e11 as any).targetHandle!=="in-right")findings.push("Edge e11 debe conectar BFF(out-left) → ReadModel(in-right)"); const e12=edges.find((e)=>e.id==="e12"); if(!e12||e12.source!=="web"||e12.target!=="bff"||(e12 as any).sourceHandle!=="out-left"||(e12 as any).targetHandle!=="in-right")findings.push("Edge e12 debe conectar Web(out-left) → BFF(in-right) [REST/WS]"); const e13=edges.find((e)=>e.id==="e13"); if(!e13||e13.source!=="web"||e13.target!=="bff"||(e13 as any).sourceHandle!=="out-top"||(e13 as any).targetHandle!=="in-top")findings.push("Edge e13 debe conectar Web(out-top) → BFF(in-top) [GraphQL]"); const e14=edges.find((e)=>e.id==="e14"); if(!e14||e14.source!=="bff"||e14.target!=="closeticket"||(e14 as any).targetHandle!=="in-right")findings.push("Edge e14 debe conectar BFF → Ticket Manager (in-right)"); const e15=edges.find((e)=>e.id==="e15"); if(!e15||e15.source!=="flow"||e15.target!=="closeticket"||(e15 as any).targetHandle!=="in-top")findings.push("Edge e15 debe conectar Flow → Ticket Manager (in-top)"); const e16=edges.find((e)=>e.id==="e16"); if(!e16||e16.source!=="closeticket"||e16.target!=="flow"||(e16 as any).sourceHandle!=="out-left"||(e16 as any).targetHandle!=="in-right")findings.push("Edge e16 debe conectar Ticket Manager(out-left) → Flow(in-right) [opcional]"); const e18=edges.find((e)=>e.id==="e18"); if(!e18||e18.source!=="outgoing"||e18.target!=="kafka"||(e18 as any).sourceHandle!=="out-left"||(e18 as any).targetHandle!=="in-right")findings.push("Edge e18 debe conectar Outgoing(out-left) → Kafka(in-right) [producer denat]"); const e19=edges.find((e)=>e.id==="e19"); if(!e19||e19.source!=="bff"||e19.target!=="outgoing"||(e19 as any).sourceHandle!=="out-bottom"||(e19 as any).targetHandle!=="in-right")findings.push("Edge e19 debe conectar BFF(out-bottom) → Outgoing(in-right) [gRPC]"); const tm=nodeMap.get("closeticket") as any; if(tm){ const tmDbs=(tm.data&&tm.data.dbs)||[]; if(!tmDbs.some((d:string)=>String(d).toLowerCase().includes("redis")))findings.push("Ticket Manager debe mostrar REDIS en DBs"); const secs=(tm.data&&tm.data.sections)||[]; if(!secs.some((s:any)=>s&&s.title==="AutoClose 24h"))findings.push("Ticket Manager: falta sección AutoClose 24h"); if(!secs.some((s:any)=>s&&s.title==="Reassign HOLDING"))findings.push("Ticket Manager: falta sección Reassign HOLDING"); } const kafka=nodeMap.get("kafka") as any; const sections=kafka&&kafka.data&&Array.isArray(kafka.data.sections)?kafka.data.sections:[]; if(sections.length<2)findings.push("Kafka debe declarar 'message_received' y 'events_denat'"); else{ const mr=sections.find((s:any)=>s&&s.title==="message_received"); const ed=sections.find((s:any)=>s&&s.title==="events_denat"); if(!mr)findings.push("Kafka: falta sección 'message_received'"); if(!ed)findings.push("Kafka: falta sección 'events_denat'"); if(mr&&!(String(mr.subtitle||"").includes("partitions: 60")))findings.push("Kafka: 'message_received' debe indicar partitions: 60"); if(ed&&!(String(ed.subtitle||"").includes("partitions: 60")))findings.push("Kafka: 'events_denat' debe indicar partitions: 60"); } return findings; },[nodes,edges]);

  return(
    <div style={{ width:"100%", minHeight:"100vh", background:"linear-gradient(180deg, #e2e8f0, #ffffff)", color:"#0f172a", padding:0, margin:0, boxSizing:"border-box" }}>
      <GlobalStyles/>
      <div style={{ width:"95%", padding:"16px", margin:"0 auto", boxSizing:"border-box" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Arquitectura - Nuevo Laraigo</h1>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={toggleAnim} style={{ borderRadius:16, border:"1px solid #e2e8f0", padding:"8px 12px", fontSize:13, background:"#fff", color:"#0f172a", display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>{animated? <Pause size={16}/> : <Play size={16}/>}{animated?"Pausar":"Reanudar"}</button>
            <button onClick={resetLayout} style={{ borderRadius:16, border:"1px solid #e2e8f0", padding:"8px 12px", fontSize:13, background:"#fff", color:"#0f172a", cursor:"pointer" }}>Reset</button>
            <button onClick={exportJSON} style={{ borderRadius:16, border:"1px solid #e2e8f0", padding:"8px 12px", fontSize:13, background:"#fff", color:"#0f172a", cursor:"pointer" }}>Exportar</button>
            <button onClick={()=>setShowDebug((v)=>!v)} style={{ borderRadius:16, border:"1px solid #e2e8f0", padding:"8px 12px", fontSize:13, background:"#fff", color:"#0f172a", cursor:"pointer" }}>{showDebug?"Ocultar checks":"Mostrar checks"}</button>
          </div>
        </div>
        <div style={{ border:"1px solid #e2e8f0", borderRadius:18, background:"rgba(255,255,255,.6)", overflow:"hidden", height:"80vh", minHeight:700 }}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onEdgeUpdate={onEdgeUpdate} nodeTypes={nodeTypes} defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} connectionMode={ConnectionMode.Strict} edgeUpdaterRadius={24}>
            <Controls position="bottom-right"/>
            <Background gap={16} size={1}/>
          </ReactFlow>
        </div>
        {showDebug&&(
          <div style={{ marginTop:12, border:"1px solid #e2e8f0", borderRadius:12, padding:12, background:"#f8fafc", fontSize:12, color:"#334155" }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>Sanity checks</div>
            {debugFindings.length===0? (<div style={{ color:"#10b981" }}>OK: nodos y edges consistentes.</div>) : (
              <ul style={{ paddingLeft:18, margin:0 }}>{debugFindings.map((f,i)=>(<li key={i} style={{ marginBottom:4, color:"#ef4444" }}>{f}</li>))}</ul>
            )}
          </div>
        )}
        <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12, fontSize:12, color:"#475569" }}>
          <div style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:12, background:"#f1f5f9" }}>
            <div style={{ fontWeight:700, color:"#0f172a" }}>Relays de Outbox</div>
            <ul style={{ paddingLeft:18, marginTop:6 }}>
              <li>Relay BD CONVERSATION: en <b>Ticket Manager</b></li>
              <li>Relay BD FLOW: en <b>MS Flow</b></li>
            </ul>
          </div>
          <div style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:12, background:"#f1f5f9" }}>
            <div style={{ fontWeight:700, color:"#0f172a" }}>Bases de datos</div>
            <ul style={{ paddingLeft:18, marginTop:6 }}>
              <li><span style={{ display:'inline-block', width:10, height:10, background:'rgba(14,165,233,.8)', borderRadius:2, marginRight:6 }}/>
                CONVERSATION (Postgres)</li>
              <li><span style={{ display:'inline-block', width:10, height:10, background:'rgba(100,116,139,.8)', borderRadius:2, marginRight:6 }}/>
                CONFIG (Postgres)</li>
              <li><span style={{ display:'inline-block', width:10, height:10, background:'rgba(168,85,247,.8)', borderRadius:2, marginRight:6 }}/>
                FLOW (Postgres)</li>
              <li><span style={{ display:'inline-block', width:10, height:10, background:'rgba(20,184,166,.8)', borderRadius:2, marginRight:6 }}/>
                READ MODEL (Postgres)</li>
              <li><span style={{ display:'inline-block', width:10, height:10, background:'rgba(239,68,68,.8)', borderRadius:2, marginRight:6 }}/>
                REDIS</li>
            </ul>
          </div>
          <div style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:12, background:"#f1f5f9" }}>
            <div style={{ fontWeight:700, color:"#0f172a" }}>Tecnologías</div>
            <ul style={{ paddingLeft:18, marginTop:6 }}>
              <li>MS Incoming: .NET 10</li>
              <li>MS Flow: .NET 10</li>
              <li>MS Hook IN: .NET 10</li>
              <li>MS Outgoing: .NET 10</li>
              <li>Projector: .NET 10</li>
              <li>Ticket Manager: .NET 10</li>
              <li>BFF: Node 22 + NestJS</li>
              <li>Cliente Web: React</li>
              <li>DBMS: Postgres</li>
            </ul>
          </div>
          <div style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:12, background:"#f1f5f9" }}>
            <div style={{ fontWeight:700, color:"#0f172a" }}>Topics Kafka</div>
            <ul style={{ paddingLeft:18, marginTop:6 }}>
              <li><b>message_received</b>: Producer = MS Hook IN · Consumer = MS Incoming · <b>partitions</b> = 60</li>
              <li><b>events_denat</b>: Producers = Incoming, Flow, Ticket Manager, Outgoing · Consumer = Projector · <b>partitions</b> = 60</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop:16, fontSize:12, color:"#475569" }}>
          <span style={{ fontFamily:"monospace" }}>MS</span> = microservicio · <span style={{ fontFamily:"monospace" }}>gRPC</span> de baja latencia · <span style={{ fontFamily:"monospace" }}>Channel</span> para ejecución BG · <span style={{ fontFamily:"monospace" }}>DBMS</span>: Postgres · <span style={{ fontFamily:"monospace" }}>BFF</span> en Node 22/NestJS → <span style={{ fontFamily:"monospace" }}>React</span> Web
        </div>
      </div>
    </div>
  );
}
