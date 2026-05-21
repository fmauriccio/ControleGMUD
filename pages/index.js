import { useState, useEffect, useCallback, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from 'recharts'

// ─── Config ───────────────────────────────────────────────────────────────────
const HIDDEN = new Set(['Cancelado','Em Produção','Concluído','Done','Canceled'])
const SC = {
  'Em Homologação':         {bg:'rgba(249,115,22,.18)',  tx:'#FB923C',dot:'#F97316'},
  'Code Review':            {bg:'rgba(139,92,246,.18)',  tx:'#A78BFA',dot:'#8B5CF6'},
  'Aguardando Testes':      {bg:'rgba(59,130,246,.18)',  tx:'#60A5FA',dot:'#3B82F6'},
  'Em Desenvolvimento':     {bg:'rgba(20,184,166,.18)',  tx:'#2DD4BF',dot:'#14B8A6'},
  'Aguardando deploy':      {bg:'rgba(245,158,11,.18)',  tx:'#FCD34D',dot:'#F59E0B'},
  'Itens em Backlog':       {bg:'rgba(100,116,139,.18)', tx:'#94A3B8',dot:'#64748B'},
  'Em teste':               {bg:'rgba(6,182,212,.18)',   tx:'#22D3EE',dot:'#06B6D4'},
  'Em Refinamento Técnico': {bg:'rgba(99,102,241,.18)',  tx:'#818CF8',dot:'#6366F1'},
  'Aguardando Homologação': {bg:'rgba(251,146,60,.18)',  tx:'#FDBA74',dot:'#FB923C'},
  'Comprometido':           {bg:'rgba(217,70,239,.18)',  tx:'#E879F9',dot:'#D946EF'},
  'Refinado':               {bg:'rgba(56,189,248,.18)',  tx:'#7DD3FC',dot:'#38BDF8'},
  'Blocked':                {bg:'rgba(239,68,68,.18)',   tx:'#F87171',dot:'#EF4444'},
  'In Progress':            {bg:'rgba(245,158,11,.18)',  tx:'#FCD34D',dot:'#F59E0B'},
  'To Do':                  {bg:'rgba(59,130,246,.18)',  tx:'#60A5FA',dot:'#3B82F6'},
  'In Review':              {bg:'rgba(139,92,246,.18)',  tx:'#A78BFA',dot:'#8B5CF6'},
}
const gsc = s => SC[s] || {bg:'rgba(148,163,184,.15)',tx:'#94A3B8',dot:'#64748B'}

const T = {
  bg:'#0A0F1E', sidebar:'#0D1117', card:'#111827', card2:'#1E293B',
  border:'rgba(148,163,184,.1)', border2:'rgba(148,163,184,.05)',
  text:'#E2E8F0', sec:'#94A3B8', ter:'#475569',
  green:'#10B981', teal:'#1AAB8A', red:'#EF4444', amber:'#F59E0B',
}

const CHECKLIST_DEFAULTS = [
  {id:'tests',   label:'Testes realizados e aprovados'},
  {id:'homolog', label:'Ambiente de homologação validado'},
  {id:'rollback',label:'Plano de rollback documentado'},
  {id:'comunicado',label:'Comunicado enviado aos stakeholders'},
  {id:'janela',  label:'Janela de manutenção confirmada'},
  {id:'dba',     label:'Aprovação DBA (se necessário)'},
  {id:'monitor', label:'Monitoramento pós-deploy configurado'},
]

const MEETING_TYPES = ['Daily','Sprint Planning','Sprint Review','Retrospectiva','Refinamento','Outro']
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fd = d => { const x=new Date(); x.setDate(x.getDate()+d); return x.toISOString().split('T')[0] }
const uid = () => Math.random().toString(36).slice(2,9)
const fmt = ds => ds ? new Date(ds+'T00:00:00').toLocaleDateString('pt-BR') : '-'
const fmtM = ds => ds ? new Date(ds+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) : '-'

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE = [
  {key:'PROJ-101',fields:{summary:'Implementar autenticação SSO',status:{name:'Em Homologação'},assignee:{displayName:'Ana Silva'}}},
  {key:'PROJ-102',fields:{summary:'Refatorar módulo de pagamentos',status:{name:'Aguardando Testes'},assignee:{displayName:'Carlos Mendes'}}},
  {key:'PROJ-103',fields:{summary:'Corrigir bug no relatório mensal',status:{name:'Blocked'},assignee:{displayName:'Ana Silva'}}},
  {key:'PROJ-104',fields:{summary:'Migrar banco de dados para v2',status:{name:'Em Desenvolvimento'},assignee:{displayName:'Rafael Costa'}}},
  {key:'PROJ-106',fields:{summary:'Implementar cache Redis',status:{name:'Code Review'},assignee:{displayName:'Carlos Mendes'}}},
  {key:'PROJ-107',fields:{summary:'Deploy da API v3.0',status:{name:'Aguardando Testes'},assignee:{displayName:'Rafael Costa'}}},
  {key:'PROJ-108',fields:{summary:'Criar testes de integração E2E',status:{name:'Em Refinamento Técnico'},assignee:{displayName:'Juliana Rocha'}}},
  {key:'PROJ-110',fields:{summary:'Configurar pipeline CI/CD',status:{name:'Em Homologação'},assignee:{displayName:'Carlos Mendes'}}},
]
const SAMPLE_GMUD = {
  'PROJ-104':{date:fd(2),executed:false,executedAt:''},
  'PROJ-107':{date:fd(6),executed:false,executedAt:''},
  'PROJ-110':{date:fd(14),executed:false,executedAt:''},
  'PROJ-101':{date:fd(21),executed:false,executedAt:''},
  'PROJ-106':{date:fd(28),executed:false,executedAt:''},
}

// ─── Share encode/decode ──────────────────────────────────────────────────────
const encShare = (cards,gmud,jiraUrl) => {
  try {
    const d=JSON.stringify({cards:cards.map(c=>({k:c.key,t:c.title,s:c.status,a:c.assignee})),gmud})
    return btoa(String.fromCharCode(...new TextEncoder().encode(d)))
  } catch{return''}
}
const decShare = s => {
  try { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)))) }
  catch{return null}
}

// ─── PDF printer ─────────────────────────────────────────────────────────────
function printMeeting(m) {
  const items = (m.items||[]).map(i=>`<li style="margin:6px 0;${i.done?'text-decoration:line-through;color:#888':''}">${i.text}${i.owner?` <span style="color:#1AAB8A;font-size:12px">→ ${i.owner}</span>`:''}</li>`).join('')
  const actions = (m.actions||[]).map(a=>`<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${a.done?'✅':'⬜'}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${a.text}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#1AAB8A;">${a.owner||'-'}</td></tr>`).join('')
  const html = `<html><head><title>${m.title}</title><style>
    body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
    h1{color:#1AAB8A;margin-bottom:4px} .sub{color:#888;font-size:13px;margin-bottom:24px}
    h2{font-size:14px;font-weight:700;color:#333;margin:20px 0 8px;text-transform:uppercase;letter-spacing:.5px}
    ul{padding-left:20px} li{margin:6px 0;font-size:14px}
    table{width:100%;border-collapse:collapse;font-size:13px} th{background:#f5f5f5;padding:8px;text-align:left}
    .notes{background:#f9f9f9;padding:12px;border-radius:6px;font-size:13px;line-height:1.6}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:#e8f5f1;color:#1AAB8A}
    @media print{body{padding:20px}}
  </style></head><body>
    <h1>${m.title}</h1>
    <div class="sub">${fmt(m.date)} &nbsp;·&nbsp; <span class="badge">${m.type}</span>${m.participants?` &nbsp;·&nbsp; ${m.participants}`:''}</div>
    ${items?`<h2>📋 Pauta / Discussões</h2><ul>${items}</ul>`:''}
    ${actions?`<h2>✅ Ações & Responsáveis</h2><table><tr><th style="width:40px"></th><th>Ação</th><th>Responsável</th></tr>${actions}</table>`:''}
    ${m.notes?`<h2>📝 Observações</h2><div class="notes">${m.notes.replace(/\n/g,'<br>')}</div>`:''}
    <div style="margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px">Gerado pelo GMUD Manager · ${new Date().toLocaleString('pt-BR')}</div>
  </body></html>`
  const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400)
}

// ─── Components ───────────────────────────────────────────────────────────────
function Badge({s}) {
  const c=gsc(s)
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:c.bg,color:c.tx,whiteSpace:'nowrap'}}>
    <span style={{width:6,height:6,borderRadius:'50%',background:c.dot,flexShrink:0}}/>
    {s}
  </span>
}

function Card({children,style}){return<div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:'18px 20px',...style}}>{children}</div>}

function SectionTitle({children}){return<div style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>{children}</div>}

function Btn({children,primary,small,danger,onClick,disabled,style={}}){
  const base={display:'inline-flex',alignItems:'center',gap:6,border:'none',borderRadius:8,cursor:disabled?'not-allowed':'pointer',fontWeight:500,transition:'all .15s',opacity:disabled?.6:1,...style}
  const sz=small?{padding:'5px 11px',fontSize:12}:{padding:'9px 18px',fontSize:13}
  let col
  if(primary) col={background:`linear-gradient(135deg,${T.teal},${T.green})`,color:'#fff'}
  else if(danger) col={background:'rgba(239,68,68,.15)',color:'#F87171',border:`1px solid rgba(239,68,68,.3)`}
  else col={background:T.card2,color:T.sec,border:`1px solid ${T.border}`}
  return<button style={{...base,...sz,...col}} onClick={onClick} disabled={disabled}>{children}</button>
}

function CardLink({k, jiraUrl, style={}}){
  const base={fontWeight:700,...style}
  const [url,setUrl]=useState(jiraUrl||'')
  useEffect(()=>{
    if(jiraUrl){setUrl(jiraUrl);return}
    try{const s=localStorage.getItem('gmud-jiraUrl');if(s)setUrl(s)}catch{}
  },[jiraUrl])
  if(url){
    const clean=url.replace(/\/$/,'')
    return<a href={`${clean}/browse/${k}`} target="_blank" rel="noreferrer" style={{textDecoration:'none',...base}}>{k}</a>
  }
  return<span style={base}>{k}</span>
}

function TT(p){return<Tooltip {...p} contentStyle={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text}}/>}

function Progress({value,color,label}){
  return<div>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
      <span style={{fontSize:12,color:T.sec}}>{label}</span>
      <span style={{fontSize:12,fontWeight:700,color:color||T.text}}>{value}%</span>
    </div>
    <div style={{height:6,borderRadius:3,background:T.card2,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${value}%`,background:color||T.teal,borderRadius:3,transition:'width .5s'}}/>
    </div>
  </div>
}

function HealthKpi({label,value,sub,color,icon}){
  return<div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 18px'}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
      <span style={{fontSize:20}}>{icon}</span>
      <span style={{fontSize:11,color:T.ter,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</span>
    </div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.text,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.ter,marginTop:4}}>{sub}</div>}
  </div>
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function CalendarView({cards,gmud,onCardClick,jiraUrl,onDayClick}){
  const [y,setY]=useState(new Date().getFullYear())
  const [m,setM]=useState(new Date().getMonth())
  const today=new Date()

  const daysInMonth=new Date(y,m+1,0).getDate()
  const firstDay=new Date(y,m,1).getDay()
  const cells=[]
  for(let i=0;i<firstDay;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)

  const byDay={}
  cards.forEach(c=>{
    const g=gmud[c.key]
    if(!g?.date) return
    const [cy,cm,cd]=g.date.split('-').map(Number)
    if(cy===y && cm===m+1) {
      if(!byDay[cd]) byDay[cd]=[]
      byDay[cd].push({...c,gmud:g})
    }
  })

  const prev=()=>{if(m===0){setM(11);setY(y-1)}else setM(m-1)}
  const next=()=>{if(m===11){setM(0);setY(y+1)}else setM(m+1)}

  return<div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <h1 style={{fontSize:22,fontWeight:700}}>Calendário de GMUDs</h1>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <Btn small onClick={prev}>◀</Btn>
        <span style={{fontSize:15,fontWeight:600,minWidth:160,textAlign:'center'}}>{MONTHS_PT[m]} {y}</span>
        <Btn small onClick={next}>▶</Btn>
        <Btn small onClick={()=>{setM(today.getMonth());setY(today.getFullYear())}}>Hoje</Btn>
      </div>
    </div>
    <Card style={{padding:'16px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8}}>
        {DAYS_PT.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,color:T.ter,padding:'4px',textTransform:'uppercase',letterSpacing:'.5px'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {cells.map((day,i)=>{
          if(!day) return<div key={`e${i}`}/>
          const isToday=day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear()
          const events=byDay[day]||[]
          return<div key={day} onClick={()=>events.length>0&&onDayClick&&onDayClick({day,events})} style={{minHeight:80,background:isToday?'rgba(26,171,138,.1)':T.card2,borderRadius:8,padding:'6px',border:`1px solid ${isToday?T.teal:T.border2}`,cursor:events.length>0?'pointer':'default'}}>
            <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?T.teal:T.sec,marginBottom:3}}>{day}</div>
            {events.slice(0,3).map(e=>{
              const sc=gsc(e.status)
              return<div key={e.key} onClick={()=>onCardClick&&onCardClick(e)} title={`${e.key}: ${e.title}`}
                style={{fontSize:10,fontWeight:600,padding:'2px 5px',borderRadius:4,background:e.gmud.executed?'rgba(52,211,153,.15)':sc.bg,color:e.gmud.executed?'#34D399':sc.tx,marginBottom:2,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {e.gmud.executed?'✓ ':''}<CardLink k={e.key} jiraUrl={jiraUrl} style={{color:'inherit'}}/>
              </div>
            })}
            {events.length>3&&<div style={{fontSize:9,color:T.ter}}>+{events.length-3} mais</div>}
          </div>
        })}
      </div>
    </Card>
    <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
      {[{color:'rgba(26,171,138,.3)',tx:'#34D399',lbl:'Executada'},{color:'rgba(59,130,246,.18)',tx:'#60A5FA',lbl:'Agendada'},{color:'rgba(239,68,68,.18)',tx:'#F87171',lbl:'Atrasada'}].map(l=>(
        <div key={l.lbl} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:T.sec}}>
          <span style={{width:10,height:10,borderRadius:3,background:l.color,border:`1px solid ${l.tx}`}}/>
          {l.lbl}
        </div>
      ))}
    </div>
  </div>
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState('dashboard')
  const [cards,setCards]=useState([])
  const [gmud,setGmud]=useState({})
  const [cfg,setCfg]=useState({jiraUrl:'',email:'',token:'',project:'',jql:''})
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState(null)
  const [fTxt,setFTxt]=useState('')
  const [fSt,setFSt]=useState('')
  const [saved,setSaved]=useState(false)
  const [copied,setCopied]=useState(false)
  const [readOnly,setRO]=useState(false)
  const [checklist,setChecklist]=useState({})
  const [meetings,setMeetings]=useState([])
  const [selMeeting,setSelMeeting]=useState(null)
  const [newMeeting,setNewMeeting]=useState(false)
  const [newMeetForm,setNMF]=useState({date:new Date().toISOString().split('T')[0],type:'Daily',title:'',participants:''})
  const [histMonth,setHistMonth]=useState('')
  const [calModal,setCalModal]=useState(null)  // {day, events}
  const [blockedModal,setBlockedModal]=useState(false)
  const [planner,setPlanner]=useState({})
  const [plannerWeek,setPlannerWeek]=useState(0) // offset from current week
  const [retroSession,setRetroSession]=useState(null)
  const [retroTitle,setRetroTitle]=useState('')

  useEffect(()=>{
    if(typeof window==='undefined') return
    const p=new URLSearchParams(window.location.search)
    const sh=p.get('share')
    if(sh){
      const d=decShare(sh)
      if(d){setCards(d.cards.map(c=>({key:c.k,title:c.t,status:c.s,assignee:c.a})));setGmud(d.gmud||{});if(d.jiraUrl)setCfg(p=>({...p,jiraUrl:d.jiraUrl}));if(d.meetings)setMeetings(d.meetings);if(d.checklist)setChecklist(d.checklist);setRO(true);return}
    }
    try{
      const c=localStorage.getItem('gmud-cfg');if(c)setCfg(JSON.parse(c))
      const g=localStorage.getItem('gmud-gmud');if(g)setGmud(JSON.parse(g))
      const k=localStorage.getItem('gmud-cards');if(k)setCards(JSON.parse(k))
      const cl=localStorage.getItem('gmud-checklist');if(cl)setChecklist(JSON.parse(cl))
      const mt=localStorage.getItem('gmud-meetings');if(mt)setMeetings(JSON.parse(mt))
      // jiraUrl also saved independently for reliability
      const ju=localStorage.getItem('gmud-jiraUrl');if(ju)setCfg(p=>({...p,jiraUrl:ju}))
      const pl=localStorage.getItem('gmud-planner');if(pl)setPlanner(JSON.parse(pl))
    }catch{}
    // Auto-sync if credentials already saved
    try{
      const saved=JSON.parse(localStorage.getItem('gmud-cfg')||'{}')
      const ju2=localStorage.getItem('gmud-jiraUrl')
      const url=saved.jiraUrl||ju2
      if(url&&saved.email&&saved.token&&saved.project){
        const jql=saved.jql||`project = ${saved.project} ORDER BY updated DESC`
        fetch('/api/jira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jiraUrl:url,email:saved.email,token:saved.token,jql,maxResults:200})})
          .then(r=>r.json()).then(d=>{if(d.issues)proc(d.issues)}).catch(()=>{})
      }
    }catch{}
  },[])

  const persist=useCallback((nc,ng,nf,ncl,nmt)=>{
    try{
      if(nc!==undefined)localStorage.setItem('gmud-cards',JSON.stringify(nc))
      if(ng!==undefined)localStorage.setItem('gmud-gmud',JSON.stringify(ng))
      if(nf!==undefined)localStorage.setItem('gmud-cfg',JSON.stringify(nf))
      if(ncl!==undefined)localStorage.setItem('gmud-checklist',JSON.stringify(ncl))
      if(nmt!==undefined)localStorage.setItem('gmud-meetings',JSON.stringify(nmt))
    }catch{}
  },[])

  const proc=useCallback((issues,gOver)=>{
    const g=gOver??gmud
    const p=issues.filter(i=>!HIDDEN.has(i.fields?.status?.name)||gmud[i.key]?.executed).map(i=>({key:i.key,title:i.fields?.summary||'',status:i.fields?.status?.name||'To Do',assignee:i.fields?.assignee?.displayName||'—',flagged:!!(i.fields?.flagged||(i.fields?.customfield_10021?.length>0))}))
    setCards(p);persist(p,undefined,undefined,undefined,undefined)
  },[gmud,persist])

  const connect=async()=>{
    if(!cfg.jiraUrl||!cfg.email||!cfg.token||!cfg.project){setMsg({t:'err',m:'Preencha todos os campos.'});return}
    setLoading(true);setMsg(null)
    const jql=cfg.jql||`project = ${cfg.project} ORDER BY updated DESC`
    try{
      const r=await fetch('/api/jira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jiraUrl:cfg.jiraUrl,email:cfg.email,token:cfg.token,jql,maxResults:200})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'Erro')
      proc(d.issues||[]);persist(undefined,undefined,cfg,undefined,undefined)
      setMsg({t:'ok',m:`${d.issues?.length||0} cards carregados!`})
    }catch(e){setMsg({t:'err',m:e.message})}
    finally{setLoading(false)}
  }

  const importJSON=()=>{
    const raw=document.getElementById('jsin')?.value?.trim();if(!raw)return
    try{const p=JSON.parse(raw);const iss=p.issues||p;if(!Array.isArray(iss))throw new Error('Array esperado');proc(iss);setMsg({t:'ok',m:`${iss.length} importados!`})}
    catch(e){setMsg({t:'err',m:'JSON inválido: '+e.message})}
  }

  const loadSample=()=>{setGmud(SAMPLE_GMUD);persist(undefined,SAMPLE_GMUD,undefined,undefined,undefined);proc(SAMPLE,SAMPLE_GMUD);setTab('dashboard')}

  const upGmud=(key,field,val)=>{
    const ng={...gmud,[key]:{...(gmud[key]||{executed:false,executedAt:'',checklistCustom:[]}),[field]:val}}
    setGmud(ng);persist(undefined,ng,undefined,undefined,undefined)
  }

  const toggleDone=(key)=>{
    const cur=gmud[key]?.executed||false
    const ng={...gmud,[key]:{...(gmud[key]||{}),executed:!cur,executedAt:!cur?new Date().toISOString().split('T')[0]:''}}
    setGmud(ng);persist(undefined,ng,undefined,undefined,undefined)
  }

  const toggleCheck=(cardKey,itemId)=>{
    const ncl={...checklist,[cardKey]:{...(checklist[cardKey]||{}),[itemId]:!(checklist[cardKey]?.[itemId])}}
    setChecklist(ncl);persist(undefined,undefined,undefined,ncl,undefined)
  }

  const addMeeting=()=>{
    if(!newMeetForm.title.trim())return
    const nm={...newMeetForm,id:uid(),items:[],actions:[],notes:''}
    const nmt=[nm,...meetings]
    setMeetings(nmt);persist(undefined,undefined,undefined,undefined,nmt)
    setSelMeeting(nm);setNewMeeting(false)
  }

  const updMeeting=(id,changes)=>{
    const nmt=meetings.map(m=>m.id===id?{...m,...changes}:m)
    setMeetings(nmt);persist(undefined,undefined,undefined,undefined,nmt)
    setSelMeeting(p=>p?.id===id?{...p,...changes}:p)
  }

  const addItem=(mid,type)=>{
    const m=meetings.find(x=>x.id===mid)
    if(!m)return
    const key=type==='item'?'items':'actions'
    const ni=type==='item'?{id:uid(),text:'',done:false,owner:''}:{id:uid(),text:'',owner:'',done:false}
    updMeeting(mid,{[key]:[...(m[key]||[]),ni]})
  }

  const updItem=(mid,type,iid,changes)=>{
    const m=meetings.find(x=>x.id===mid);if(!m)return
    const key=type==='item'?'items':'actions'
    updMeeting(mid,{[key]:(m[key]||[]).map(i=>i.id===iid?{...i,...changes}:i)})
  }

  const delItem=(mid,type,iid)=>{
    const m=meetings.find(x=>x.id===mid);if(!m)return
    const key=type==='item'?'items':'actions'
    updMeeting(mid,{[key]:(m[key]||[]).filter(i=>i.id!==iid)})
  }

  const delMeeting=(id)=>{
    const nmt=meetings.filter(m=>m.id!==id)
    setMeetings(nmt);persist(undefined,undefined,undefined,undefined,nmt)
    if(selMeeting?.id===id)setSelMeeting(null)
  }

  const saveAll=()=>{persist(cards,gmud,cfg,checklist,meetings);try{localStorage.setItem('gmud-jiraUrl',cfg.jiraUrl)}catch{};setSaved(true);setTimeout(()=>setSaved(false),2000)}

  const createSession = async (mode, extra={}) => {
    const sid = Math.random().toString(36).slice(2,10).toUpperCase()
    const body = { action:'create', sessionId:sid, mode, ...extra }
    const r = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const s = await r.json()
    return s
  }

  const startRetro = async () => {
    if (!retroTitle.trim()) return
    const s = await createSession('retro',{title:retroTitle})
    setRetroSession(s)
  }

  const savePlanner = (newPlanner) => {
    setPlanner(newPlanner)
    try{localStorage.setItem('gmud-planner',JSON.stringify(newPlanner))}catch{}
  }

  const updPlannerDay = (dateKey, val) => {
    const np = {...planner, [dateKey]: {...(planner[dateKey]||{}), notes: val}}
    savePlanner(np)
  }

  const updPlannerField = (weekKey, field, val) => {
    const np = {...planner, [`meta_${weekKey}`]: {...(planner[`meta_${weekKey}`]||{}), [field]: val}}
    savePlanner(np)
  }

  const addPrioridade = (weekKey) => {
    const meta = planner[`meta_${weekKey}`]||{}
    const prios = [...(meta.prioridades||[]), {id:Math.random().toString(36).slice(2,8),text:'',done:false}]
    updPlannerField(weekKey,'prioridades',prios)
  }

  const updPrioridade = (weekKey,id,changes) => {
    const meta = planner[`meta_${weekKey}`]||{}
    const prios = (meta.prioridades||[]).map(p=>p.id===id?{...p,...changes}:p)
    updPlannerField(weekKey,'prioridades',prios)
  }

  const delPrioridade = (weekKey,id) => {
    const meta = planner[`meta_${weekKey}`]||{}
    const prios = (meta.prioridades||[]).filter(p=>p.id!==id)
    updPlannerField(weekKey,'prioridades',prios)
  }

  const printPlanner = (weekDays, weekKey) => {
    const meta = planner['meta_' + weekKey] || {}
    const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
    const daysHTML = weekDays.map((d,i) => {
      const notes = planner[d.key]?.notes || ''
      return '<div style="flex:1;min-width:100px;border-right:1px solid #ddd;padding:0 10px">'
        + '<div style="font-weight:700;color:#1AAB8A;font-size:12px;text-transform:uppercase">' + DAYS_FULL[i] + '</div>'
        + '<div style="font-size:11px;color:#666;margin-bottom:6px">' + d.label + '</div>'
        + '<div style="font-size:12px;line-height:1.6;white-space:pre-wrap">' + (notes||'—') + '</div>'
        + '</div>'
    }).join('')
    const prios = (meta.prioridades||[]).map(p =>
      '<li style="margin:4px 0;font-size:12px' + (p.done?';text-decoration:line-through;color:#999':'') + '">' + p.text + '</li>'
    ).join('')
    const ps = meta.prioridades?.length ? '<div><h2 style="font-size:13px">⭐ Prioridades</h2><ul>' + prios + '</ul></div>' : ''
    const is = meta.importante ? '<div style="margin-top:14px"><h2 style="font-size:13px">⚠ Importante</h2><p style="font-size:12px">' + meta.importante + '</p></div>' : ''
    const html = '<html><head><title>Planner</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:1000px;margin:0 auto}h1{color:#1AAB8A}@media print{body{padding:10px}}</style></head><body>'
      + '<h1>📅 Planner Semanal</h1><p style="color:#888;font-size:12px;margin-bottom:20px">' + weekDays[0].label + ' — ' + weekDays[6].label + '</p>'
      + '<div style="display:flex;border:1px solid #ddd;border-radius:8px;padding:14px;min-height:200px;margin-bottom:20px">' + daysHTML + '</div>'
      + ps + is + '</body></html>'
    const w = window.open('','_blank')
    w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400)
  }

  const shareLink=()=>{
    const enc=encShare(cards,gmud,cfg.jiraUrl,meetings,checklist)
    const url=`${window.location.origin}/?share=${enc}`
    navigator.clipboard.writeText(url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000)})
  }

  const exportCSV=()=>{
    const rows=[['Chave','Título','Status','Responsável','Data GMUD','Executada','Data Execução']]
    cards.filter(c=>gmud[c.key]?.date).forEach(c=>{const g=gmud[c.key]||{};rows.push([c.key,c.title,c.status,c.assignee,g.date||'',g.executed?'Sim':'Não',g.executedAt||''])})
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'}));a.download=`gmud_${new Date().toISOString().split('T')[0]}.csv`;a.click()
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const now=new Date()
  const visible=cards.filter(c=>!HIDDEN.has(c.status))
  const statuses=[...new Set(visible.map(c=>c.status))].sort()
  const stCounts=visible.reduce((a,c)=>{a[c.status]=(a[c.status]||0)+1;return a},{})
  const pie=Object.entries(stCounts).map(([n,v])=>({name:n,value:v,fill:gsc(n).dot}))
  const asgn=Object.entries(visible.reduce((a,c)=>{if(c.assignee!=='—')a[c.assignee]=(a[c.assignee]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,v])=>({name:n.split(' ')[0],value:v}))
  const asnColors=['#10B981','#60A5FA','#A78BFA','#F97316','#F87171','#FCD34D','#2DD4BF','#E879F9']

  const gmudPend=visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed&&new Date(gmud[c.key].date+'T00:00:00')>=now).length
  const gmudDone=visible.filter(c=>gmud[c.key]?.executed).length
  const gmudLate=visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed&&new Date(gmud[c.key].date+'T00:00:00')<now).length

  const upcoming=[...visible].filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).sort((a,b)=>gmud[a.key].date.localeCompare(gmud[b.key].date)).slice(0,8)

  const monthBar=useMemo(()=>{
    const mo={}
    for(let i=-1;i<=4;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);mo[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`]=0}
    visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).forEach(c=>{const m=gmud[c.key].date.substring(0,7);if(m in mo)mo[m]++})
    const cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    return Object.entries(mo).map(([k,v])=>{const[y,m]=k.split('-');return{name:new Date(+y,+m-1,1).toLocaleString('pt-BR',{month:'short',year:'2-digit'}),value:v,cur:k===cm}})
  },[visible,gmud])

  const sorted=[...visible].filter(c=>{
    const q=fTxt.toLowerCase()
    return(!q||c.key.toLowerCase().includes(q)||c.title.toLowerCase().includes(q)||c.assignee.toLowerCase().includes(q))&&(!fSt||c.status===fSt)
  }).sort((a,b)=>{
    const ga=gmud[a.key]||{},gb=gmud[b.key]||{}
    if(ga.executed&&!gb.executed)return 1;if(!ga.executed&&gb.executed)return -1
    if(ga.date&&gb.date)return ga.date.localeCompare(gb.date)
    if(ga.date)return -1;if(gb.date)return 1;return 0
  })

  // History by month
  const executedCards=cards.filter(c=>gmud[c.key]?.executed&&gmud[c.key]?.date)
  const histByMonth=executedCards.reduce((a,c)=>{
    const m=gmud[c.key].date.substring(0,7)
    if(!a[m])a[m]=[]
    a[m].push(c)
    return a
  },{})
  const histMonths=Object.keys(histByMonth).sort().reverse()
  const curHistMonth=histMonth||histMonths[0]||''

  // Health metrics
  const totalV=visible.length||1
  const blockedCount=(stCounts['Blocked']||0)+visible.filter(c=>c.flagged).length
  const blockedPct=Math.round((blockedCount/totalV)*100)
  const withGmud=visible.filter(c=>gmud[c.key]?.date).length
  const gmudCoverage=Math.round((withGmud/totalV)*100)
  const onTimePct=gmudDone>0?Math.round(((gmudDone-0)/gmudDone)*100):100
  const topPerson=asgn[0]?.name||'—'
  const avgPerPerson=asgn.length>0?Math.round(visible.length/asgn.length):0

  const dayTag=ds=>{
    const diff=Math.ceil((new Date(ds+'T00:00:00')-now)/864e5)
    if(diff<0)return{lbl:`${Math.abs(diff)}d atrás`,bg:'rgba(239,68,68,.2)',tx:'#F87171'}
    if(diff===0)return{lbl:'Hoje!',bg:'rgba(245,158,11,.25)',tx:'#FCD34D'}
    if(diff===1)return{lbl:'Amanhã',bg:'rgba(245,158,11,.2)',tx:'#FCD34D'}
    if(diff<=7)return{lbl:`em ${diff}d`,bg:'rgba(245,158,11,.15)',tx:'#FCD34D'}
    return{lbl:`em ${diff}d`,bg:'rgba(16,185,129,.15)',tx:'#34D399'}
  }

  // ── Sidebar items ─────────────────────────────────────────────────────────
  const navItems=[
    {id:'dashboard',icon:'📊',label:'Dashboard'},
    {id:'cards',    icon:'🗂', label:'Cards / GMUDs'},
    {id:'calendar', icon:'📅',label:'Calendário'},
    {id:'history',  icon:'📋',label:'Histórico'},
    {id:'health',   icon:'💚',label:'Saúde do Time'},
    ...(!readOnly?[
      {id:'checklist',   icon:'✅',label:'Pré-GMUD'},
      {id:'meetings',    icon:'📝',label:'Reuniões'},
      {id:'planner',     icon:'📆',label:'Planner'},
      {id:'retro',       icon:'🔄',label:'Retrospectiva'},
      {id:'config',      icon:'⚙️',label:'Configurações'},
    ]:[]),
  ]

  const inpSt={padding:'9px 12px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13,outline:'none'}
  const selSt={padding:'9px 10px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13}
  const taSt={width:'100%',padding:10,border:`1px solid ${T.border}`,borderRadius:8,background:T.card2,color:T.text,fontSize:13,resize:'vertical',outline:'none'}

  return(
  <div style={{display:'flex',minHeight:'100vh',background:T.bg}}>
    {/* ── SIDEBAR ── */}
    <aside style={{width:220,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',padding:'20px 0',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
      <div style={{padding:'0 16px',marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${T.teal},${T.green})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>G</div>
          <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>GMUD</div><div style={{fontSize:10,color:T.ter}}>Scrum Master Tool</div></div>
        </div>
      </div>
      {readOnly&&<div style={{margin:'0 10px 16px',padding:'8px 10px',borderRadius:8,background:'rgba(16,185,129,.1)',border:`1px solid rgba(16,185,129,.2)`,fontSize:11,color:'#34D399',lineHeight:1.5}}>👁 Modo visualização<br/><span style={{color:T.ter}}>Somente leitura</span></div>}
      <nav style={{flex:1,padding:'0 10px',display:'flex',flexDirection:'column',gap:2}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===n.id?600:400,background:tab===n.id?'rgba(16,185,129,.12)':'transparent',color:tab===n.id?T.green:T.sec,textAlign:'left',transition:'all .15s'}}>
            <span style={{fontSize:15}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      {!readOnly&&cards.length>0&&(
        <div style={{padding:'12px 10px 0'}}>
          <button onClick={shareLink} style={{width:'100%',padding:'9px 10px',borderRadius:8,border:`1px solid ${T.border}`,background:'transparent',color:copied?'#34D399':T.sec,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:8,transition:'all .15s'}}>
            <span>{copied?'✓':'🔗'}</span>{copied?'Link copiado!':'Compartilhar'}
          </button>
        </div>
      )}
    </aside>

    {/* ── MAIN ── */}
    <main style={{flex:1,padding:'28px 28px',overflowY:'auto',minWidth:0}}>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard'&&(
        visible.length===0
        ?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16,textAlign:'center'}}>
            <div style={{fontSize:48}}>📋</div>
            <div style={{fontSize:18,fontWeight:600}}>Nenhum dado carregado</div>
            <div style={{fontSize:13,color:T.sec,marginBottom:8}}>Configure o Jira ou veja um exemplo</div>
            <div style={{display:'flex',gap:8}}><Btn primary onClick={()=>setTab('config')}>Configurar Jira</Btn><Btn onClick={loadSample}>📦 Ver exemplo</Btn></div>
          </div>
        :<>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Dashboard</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>{visible.length} cards ativos · {gmudPend} GMUDs pendentes</p></div>
            {!readOnly&&cfg.jiraUrl&&<Btn onClick={connect} disabled={loading}>{loading?'⏳ Sincronizando...':'🔄 Sincronizar'}</Btn>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
            {[{label:'Cards ativos',value:visible.length,color:'#60A5FA'},{label:'GMUDs pendentes',value:gmudPend,color:T.teal},{label:'Executadas',value:gmudDone,color:'#34D399'},{label:'Atrasadas',value:gmudLate,color:'#F87171'}].map(m=>(
              <div key={m.label} style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:'14px 16px'}}>
                <div style={{fontSize:10,color:T.ter,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>{m.label}</div>
                <div style={{fontSize:26,fontWeight:700,color:m.color}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            <Card>
              <SectionTitle>Cards por status</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} innerRadius={44} stroke="none">{pie.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Pie><Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:11,color:T.sec}}>{v}</span>}/><TT/></PieChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionTitle>Cards por responsável</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={asgn} layout="vertical" margin={{left:0,right:16}}>
                  <XAxis type="number" tick={{fontSize:11,fill:T.ter}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:T.sec}} width={60} axisLine={false} tickLine={false}/>
                  <TT/><Bar dataKey="value" name="Cards" radius={[0,4,4,0]}>{asgn.map((_,i)=><Cell key={i} fill={asnColors[i%asnColors.length]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{gridColumn:'1/-1'}}>
              <SectionTitle>GMUDs agendadas por mês</SectionTitle>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={monthBar} margin={{top:4}}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:T.sec}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:T.ter}} allowDecimals={false} axisLine={false} tickLine={false}/>
                  <TT/><Bar dataKey="value" name="GMUDs" radius={[4,4,0,0]}>{monthBar.map((e,i)=><Cell key={i} fill={e.cur?T.teal:'rgba(26,171,138,.3)'}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <h2 style={{fontSize:14,fontWeight:600,marginBottom:10}}>Próximas GMUDs</h2>
          {upcoming.length===0?<p style={{color:T.ter,fontSize:13}}>Nenhuma GMUD agendada.</p>:
          <div style={{display:'grid',gap:7}}>
            {upcoming.map(c=>{const g=gmud[c.key]||{},dt=dayTag(g.date);return(
              <div key={c.key} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:T.card,border:`1px solid ${T.border}`,borderRadius:9,flexWrap:'wrap'}}>
                <span style={{fontSize:12,fontWeight:600,color:T.teal,minWidth:95}}>📅 {fmtM(g.date)}</span>
                <CardLink k={c.key} jiraUrl={cfg.jiraUrl} style={{fontSize:12,color:T.ter,minWidth:80,display:'inline-block'}}/>
                <span style={{fontSize:13,flex:1,minWidth:100}}>{c.title.length>55?c.title.slice(0,55)+'…':c.title}</span>
                <Badge s={c.status}/>
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontWeight:600,background:dt.bg,color:dt.tx}}>{dt.lbl}</span>
              </div>
            )})}
          </div>}
        </>
      )}

      {/* ── CARDS / GMUDs ── */}
      {tab==='cards'&&(
        visible.length===0
        ?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}>
            <div style={{fontSize:48}}>🗂</div><div style={{fontSize:16,fontWeight:500}}>Nenhum card carregado</div>
            <div style={{display:'flex',gap:8}}><Btn primary onClick={()=>setTab('config')}>Configurar Jira</Btn><Btn onClick={loadSample}>📦 Carregar exemplo</Btn></div>
          </div>
        :<>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Cards / GMUDs</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>Ordenado por data mais próxima · {gmudLate>0&&<span style={{color:'#F87171'}}>{gmudLate} atrasada{gmudLate>1?'s':''}</span>}</p></div>
            {!readOnly&&<div style={{display:'flex',gap:8}}>{cfg.jiraUrl&&<Btn small onClick={connect} disabled={loading}>{loading?'⏳':'🔄 Sincronizar'}</Btn>}<Btn small onClick={exportCSV}>⬇ CSV</Btn><Btn small primary onClick={saveAll} style={{background:saved?`linear-gradient(135deg,#059669,#047857)`:`linear-gradient(135deg,${T.teal},${T.green})`}}>{saved?'✓ Salvo!':'💾 Salvar'}</Btn></div>}
          </div>
          <Card style={{padding:'16px 20px'}}>
            <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
              <input style={{...inpSt,flex:1,minWidth:180}} placeholder="Buscar..." value={fTxt} onChange={e=>setFTxt(e.target.value)}/>
              <select style={selSt} value={fSt} onChange={e=>setFSt(e.target.value)}>
                <option value="">Todos os status</option>
                {statuses.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr>{['Chave','Título','Status','Responsável','Data GMUD',...(!readOnly?['✓']:['Situação'])].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,fontWeight:700,color:T.ter,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {sorted.map(c=>{
                    const g=gmud[c.key]||{},done=!!g.executed,isLate=g.date&&!done&&new Date(g.date+'T00:00:00')<now
                    return<tr key={c.key} style={{background:done?'transparent':isLate?'rgba(239,68,68,.04)':g.date?'rgba(26,171,138,.04)':'transparent',opacity:done?.45:1,transition:'all .2s'}}>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,whiteSpace:'nowrap'}}>
                        <CardLink k={c.key} jiraUrl={cfg.jiraUrl} style={{fontSize:12,color:done?T.ter:isLate?'#F87171':T.teal,textDecoration:done?'line-through':'none'}}/>
                        {isLate&&<span style={{fontSize:9,marginLeft:4,color:'#F87171'}}>ATRASADA</span>}
                      </td>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:done?T.ter:T.text,textDecoration:done?'line-through':'none'}} title={c.title}>{c.title}</td>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,whiteSpace:'nowrap'}}><Badge s={c.status}/>{c.flagged&&<span style={{marginLeft:5,fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'rgba(245,158,11,.2)',color:'#F59E0B'}}>🚩 Flag</span>}</td>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:T.sec,whiteSpace:'nowrap'}}>{c.assignee}</td>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`}}>
                        {readOnly?<span style={{fontSize:12,color:g.date?T.text:T.ter}}>{fmt(g.date)}</span>:
                        <input type="date" value={g.date||''} onChange={e=>upGmud(c.key,'date',e.target.value)} disabled={done} style={{fontSize:12,padding:'5px 8px',borderRadius:7,border:`1px solid ${isLate?'rgba(239,68,68,.4)':T.border}`,background:T.card2,color:isLate&&!done?'#F87171':T.text,width:140,opacity:done?.5:1}}/>}
                      </td>
                      <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,textAlign:'center'}}>
                        {readOnly?<span style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontWeight:600,background:done?'rgba(52,211,153,.15)':'rgba(148,163,184,.1)',color:done?'#34D399':T.ter}}>{done?'✓ Executada':'Pendente'}</span>:
                        <button onClick={()=>toggleDone(c.key)} title={done?'Desfazer':'Marcar executada'} style={{width:30,height:30,borderRadius:8,border:`1.5px solid ${done?'rgba(52,211,153,.5)':T.border}`,background:done?'rgba(52,211,153,.15)':'transparent',color:done?'#34D399':T.ter,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{done?'✓':'○'}</button>}
                      </td>
                    </tr>
                  })}
                </tbody>
              </table>
              {sorted.length===0&&<div style={{textAlign:'center',padding:'24px',color:T.ter,fontSize:13}}>Nenhum card encontrado.</div>}
            </div>
          </Card>
        </>
      )}

      {/* ── CALENDÁRIO ── */}
      {tab==='calendar'&&<CalendarView cards={visible} gmud={gmud} jiraUrl={cfg.jiraUrl} onDayClick={setCalModal}/>}

      {/* ── HISTÓRICO ── */}
      {tab==='history'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Histórico de GMUDs</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>{executedCards.length} GMUD{executedCards.length!==1?'s':''} executada{executedCards.length!==1?'s':''}</p></div>
          </div>
          {histMonths.length===0?<div style={{textAlign:'center',padding:'60px 20px',color:T.ter}}><div style={{fontSize:40,marginBottom:12}}>📋</div><div>Nenhuma GMUD executada ainda.</div><div style={{fontSize:12,marginTop:6}}>Marque cards como executados na aba Cards/GMUDs.</div></div>:
          <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:16,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {histMonths.map(m=>{
                const [y,mo]=m.split('-')
                const lbl=new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
                return<button key={m} onClick={()=>setHistMonth(m)} style={{padding:'10px 12px',borderRadius:8,border:`1px solid ${curHistMonth===m?T.teal:T.border}`,background:curHistMonth===m?'rgba(26,171,138,.12)':'transparent',color:curHistMonth===m?T.teal:T.sec,cursor:'pointer',fontSize:13,textAlign:'left',fontWeight:curHistMonth===m?600:400,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{textTransform:'capitalize'}}>{lbl}</span>
                  <span style={{fontSize:11,fontWeight:700,background:curHistMonth===m?'rgba(26,171,138,.2)':'rgba(148,163,184,.1)',color:curHistMonth===m?T.teal:T.ter,padding:'1px 6px',borderRadius:10}}>{histByMonth[m]?.length}</span>
                </button>
              })}
            </div>
            <div>
              {curHistMonth&&histByMonth[curHistMonth]&&(
                <Card>
                  <SectionTitle>{new Date(curHistMonth+'-01').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()} · {histByMonth[curHistMonth].length} GMUDs</SectionTitle>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>{['Card','Título','Status','Responsável','Data GMUD','Data Execução'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,fontWeight:700,color:T.ter,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {histByMonth[curHistMonth].map(c=>{const g=gmud[c.key]||{};return(
                        <tr key={c.key}>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`}}><CardLink k={c.key} jiraUrl={cfg.jiraUrl} style={{fontSize:12,color:T.teal}}/></td>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:T.sec}} title={c.title}>{c.title}</td>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`}}><Badge s={c.status}/></td>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:T.sec}}>{c.assignee}</td>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:T.sec}}>{fmt(g.date)}</td>
                          <td style={{padding:'10px 10px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:'#34D399',fontWeight:600}}>{fmt(g.executedAt)||fmt(g.date)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          </div>}
        </>
      )}

      {/* ── SAÚDE DO TIME ── */}
      {tab==='health'&&(
        <>
          <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700}}>Saúde do Time</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>Indicadores baseados nos cards atuais do Jira</p></div>
          {visible.length===0?<div style={{textAlign:'center',padding:'60px',color:T.ter}}><div style={{fontSize:40,marginBottom:12}}>💚</div><div>Carregue os cards para ver os indicadores.</div></div>:
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
              <div onClick={()=>setBlockedModal(true)} style={{cursor:'pointer'}}>
                <HealthKpi icon="🔴" label="Cards bloqueados" value={blockedCount} sub={`${blockedPct}% do total · ${visible.filter(c=>c.flagged).length} com flag · clique para ver`} color={blockedPct>20?'#F87171':'#34D399'}/>
              </div>
              <HealthKpi icon="📅" label="Cobertura GMUD" value={`${gmudCoverage}%`} sub={`${withGmud}/${visible.length} cards`} color={gmudCoverage>60?'#34D399':gmudCoverage>30?'#FCD34D':'#F87171'}/>
              <HealthKpi icon="⚠️" label="GMUDs atrasadas" value={gmudLate} sub="sem data executada" color={gmudLate===0?'#34D399':'#F87171'}/>
              <HealthKpi icon="✅" label="Executadas" value={gmudDone} sub="neste ciclo" color="#34D399"/>
              <HealthKpi icon="👑" label="Mais sobrecarregado" value={topPerson} sub={`${asgn[0]?.value||0} cards`} color="#FCD34D"/>
              <HealthKpi icon="📊" label="Média por pessoa" value={avgPerPerson} sub="cards/responsável" color={T.teal}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
              <Card>
                <SectionTitle>Indicadores de progresso</SectionTitle>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <Progress value={gmudCoverage} color={gmudCoverage>60?'#34D399':gmudCoverage>30?'#FCD34D':'#F87171'} label="Cards com GMUD agendada"/>
                  <Progress value={Math.max(0,100-blockedPct)} color={blockedPct>20?'#F87171':'#34D399'} label="Cards sem bloqueio"/>
                  <Progress value={gmudDone+gmudPend>0?Math.round((gmudDone/(gmudDone+gmudPend))*100):0} color={T.teal} label="GMUDs executadas vs pendentes"/>
                  <Progress value={gmudLate===0?100:Math.max(0,100-Math.round((gmudLate/(gmudPend+gmudDone+1))*100))} color={gmudLate===0?'#34D399':'#F87171'} label="Taxa de pontualidade das GMUDs"/>
                </div>
              </Card>
              <Card>
                <SectionTitle>Distribuição de cards por status</SectionTitle>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(stCounts).sort((a,b)=>b[1]-a[1]).map(([s,v])=>{
                    const c=gsc(s),pct=Math.round((v/totalV)*100)
                    return<div key={s}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:11,color:c.tx,fontWeight:600,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot,display:'inline-block'}}/>{s}</span>
                        <span style={{fontSize:11,color:T.ter}}>{v} ({pct}%)</span>
                      </div>
                      <div style={{height:4,borderRadius:2,background:T.card2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:c.dot,borderRadius:2}}/>
                      </div>
                    </div>
                  })}
                </div>
              </Card>
            </div>
            <Card>
              <SectionTitle>Carga por responsável</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={asgn} margin={{top:4,right:16}}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:T.sec}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:T.ter}} allowDecimals={false} axisLine={false} tickLine={false}/>
                  <TT/><Bar dataKey="value" name="Cards" radius={[4,4,0,0]}>{asgn.map((_,i)=><Cell key={i} fill={asnColors[i%asnColors.length]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>}
        </>
      )}

      {/* ── CHECKLIST PRÉ-GMUD ── */}
      {tab==='checklist'&&(
        <>
          <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700}}>Checklist Pré-GMUD</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>Verificações obrigatórias antes de cada deploy em produção</p></div>
          {visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).length===0
          ?<div style={{textAlign:'center',padding:'60px',color:T.ter}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div>Nenhum card com GMUD agendada.</div><div style={{fontSize:12,marginTop:6}}>Defina datas na aba Cards / GMUDs.</div></div>
          :<div style={{display:'grid',gap:12}}>
            {visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).sort((a,b)=>gmud[a.key].date.localeCompare(gmud[b.key].date)).map(c=>{
              const g=gmud[c.key]||{},cl=checklist[c.key]||{}
              const done=CHECKLIST_DEFAULTS.filter(i=>cl[i.id]).length
              const pct=Math.round((done/CHECKLIST_DEFAULTS.length)*100)
              const allDone=done===CHECKLIST_DEFAULTS.length
              const dt=dayTag(g.date)
              return<Card key={c.key} style={{border:`1px solid ${allDone?'rgba(52,211,153,.3)':T.border}`}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <CardLink k={c.key} jiraUrl={cfg.jiraUrl} style={{fontSize:13,color:T.teal}}/>
                      <Badge s={c.status}/>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontWeight:600,background:dt.bg,color:dt.tx}}>{dt.lbl}</span>
                    </div>
                    <div style={{fontSize:13,color:T.text,marginBottom:2}}>{c.title}</div>
                    <div style={{fontSize:11,color:T.ter}}>📅 {fmt(g.date)} · 👤 {c.assignee}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:700,color:allDone?'#34D399':pct>50?'#FCD34D':'#F87171'}}>{pct}%</div>
                    <div style={{fontSize:10,color:T.ter}}>{done}/{CHECKLIST_DEFAULTS.length} itens</div>
                  </div>
                </div>
                <div style={{height:4,borderRadius:2,background:T.card2,overflow:'hidden',marginBottom:14}}>
                  <div style={{height:'100%',width:`${pct}%`,background:allDone?'#34D399':pct>50?'#FCD34D':'#F87171',borderRadius:2,transition:'width .4s'}}/>
                </div>
                <div style={{display:'grid',gap:6}}>
                  {CHECKLIST_DEFAULTS.map(item=>(
                    <label key={item.id} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'6px 8px',borderRadius:7,background:cl[item.id]?'rgba(52,211,153,.08)':'transparent',transition:'background .15s'}}>
                      <input type="checkbox" checked={!!cl[item.id]} onChange={()=>!readOnly&&toggleCheck(c.key,item.id)} disabled={readOnly} style={{width:16,height:16,accentColor:'#34D399',cursor:readOnly?'default':'pointer'}}/>
                      <span style={{fontSize:13,color:cl[item.id]?T.ter:T.text,textDecoration:cl[item.id]?'line-through':'none',transition:'all .15s'}}>{item.label}</span>
                    </label>
                  ))}
                </div>
                {allDone&&!readOnly&&(
                  <div style={{marginTop:12,padding:'8px 12px',borderRadius:8,background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.25)',fontSize:12,color:'#34D399',fontWeight:600,textAlign:'center'}}>
                    ✅ Checklist completo! Card pronto para GMUD.
                  </div>
                )}
              </Card>
            })}
          </div>}
        </>
      )}

      {/* ── REUNIÕES ── */}
      {tab==='meetings'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Reuniões & Anotações</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>Dailys, plannings, reviews e retrospectivas</p></div>
            {!readOnly&&<Btn primary onClick={()=>{setNewMeeting(true);setSelMeeting(null)}}>+ Nova reunião</Btn>}
          </div>

          {newMeeting&&!readOnly&&(
            <Card style={{marginBottom:16,border:`1px solid ${T.teal}`}}>
              <SectionTitle>Nova reunião</SectionTitle>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,color:T.ter,fontWeight:700,display:'block',marginBottom:4}}>DATA</label><input type="date" style={{...inpSt,width:'100%'}} value={newMeetForm.date} onChange={e=>setNMF(p=>({...p,date:e.target.value}))}/></div>
                <div><label style={{fontSize:11,color:T.ter,fontWeight:700,display:'block',marginBottom:4}}>TIPO</label><select style={{...selSt,width:'100%'}} value={newMeetForm.type} onChange={e=>setNMF(p=>({...p,type:e.target.value}))}>{MEETING_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label style={{fontSize:11,color:T.ter,fontWeight:700,display:'block',marginBottom:4}}>PARTICIPANTES</label><input style={{...inpSt,width:'100%'}} placeholder="Ana, Carlos, Rafael..." value={newMeetForm.participants} onChange={e=>setNMF(p=>({...p,participants:e.target.value}))}/></div>
                <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:T.ter,fontWeight:700,display:'block',marginBottom:4}}>TÍTULO</label><input style={{...inpSt,width:'100%'}} placeholder="Ex: Daily 20/05 | Planning Sprint 12" value={newMeetForm.title} onChange={e=>setNMF(p=>({...p,title:e.target.value}))}/></div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <Btn primary onClick={addMeeting} disabled={!newMeetForm.title.trim()}>Criar reunião</Btn>
                <Btn onClick={()=>setNewMeeting(false)}>Cancelar</Btn>
              </div>
            </Card>
          )}

          <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {meetings.length===0&&!newMeeting&&<div style={{textAlign:'center',padding:'30px 10px',color:T.ter,fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>📝</div>Nenhuma reunião ainda</div>}
              {meetings.map(m=>(
                <button key={m.id} onClick={()=>setSelMeeting(m)} style={{padding:'10px 12px',borderRadius:9,border:`1px solid ${selMeeting?.id===m.id?T.teal:T.border}`,background:selMeeting?.id===m.id?'rgba(26,171,138,.1)':'transparent',color:selMeeting?.id===m.id?T.text:T.sec,cursor:'pointer',textAlign:'left',transition:'all .15s',width:'100%'}}>
                  <div style={{fontSize:11,color:selMeeting?.id===m.id?T.teal:T.ter,marginBottom:3,fontWeight:600}}>{m.date?fmt(m.date):''} · <span style={{color:selMeeting?.id===m.id?T.teal:T.sec}}>{m.type}</span></div>
                  <div style={{fontSize:13,fontWeight:500,color:selMeeting?.id===m.id?T.text:T.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title||'Sem título'}</div>
                  <div style={{fontSize:10,color:T.ter,marginTop:3}}>{(m.items||[]).length} pauta · {(m.actions||[]).length} ações</div>
                </button>
              ))}
            </div>

            {selMeeting?(()=>{
              const m=meetings.find(x=>x.id===selMeeting.id)||selMeeting
              return<Card>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                  <div>
                    {readOnly?<div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{m.title}</div>:<input value={m.title} onChange={e=>updMeeting(m.id,{title:e.target.value})} style={{...inpSt,fontSize:16,fontWeight:700,background:'transparent',border:'none',padding:'0',color:T.text,width:'100%',marginBottom:4}} placeholder="Título da reunião"/>}
                    <div style={{fontSize:12,color:T.ter}}>{fmt(m.date)} · {m.type}{m.participants?` · ${m.participants}`:''}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <Btn small primary onClick={()=>printMeeting(m)}>🖨 PDF</Btn>
                    {!readOnly&&<Btn small danger onClick={()=>delMeeting(m.id)}>🗑</Btn>}
                  </div>
                </div>

                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <SectionTitle>📋 Pauta / Discussões</SectionTitle>
                    {!readOnly&&<Btn small onClick={()=>addItem(m.id,'item')}>+ Adicionar</Btn>}
                  </div>
                  {(m.items||[]).length===0&&<p style={{fontSize:12,color:T.ter}}>Nenhum item ainda.</p>}
                  {(m.items||[]).map(it=>(
                    <div key={it.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <input type="checkbox" checked={it.done} onChange={()=>updItem(m.id,'item',it.id,{done:!it.done})} style={{width:15,height:15,accentColor:T.teal,cursor:'pointer',flexShrink:0}}/>
                      {readOnly?<span style={{flex:1,fontSize:13,textDecoration:it.done?'line-through':'none',color:it.done?T.ter:T.text}}>{it.text}</span>:<input value={it.text} onChange={e=>updItem(m.id,'item',it.id,{text:e.target.value})} style={{...inpSt,flex:1,padding:'6px 10px',fontSize:13,textDecoration:it.done?'line-through':'none',color:it.done?T.ter:T.text}} placeholder="Descreva o item de pauta..."/>}
                      {!readOnly&&<button onClick={()=>delItem(m.id,'item',it.id)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:14,padding:'4px'}}>✕</button>}
                    </div>
                  ))}
                </div>

                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <SectionTitle>✅ Ações & Responsáveis</SectionTitle>
                    {!readOnly&&<Btn small onClick={()=>addItem(m.id,'action')}>+ Adicionar</Btn>}
                  </div>
                  {(m.actions||[]).length===0&&<p style={{fontSize:12,color:T.ter}}>Nenhuma ação definida.</p>}
                  {(m.actions||[]).map(ac=>(
                    <div key={ac.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <input type="checkbox" checked={ac.done} onChange={()=>updItem(m.id,'action',ac.id,{done:!ac.done})} style={{width:15,height:15,accentColor:'#34D399',cursor:'pointer',flexShrink:0}}/>
                      {readOnly?<><span style={{flex:2,fontSize:13,textDecoration:ac.done?'line-through':'none',color:ac.done?T.ter:T.text}}>{ac.text}</span>{ac.owner&&<span style={{fontSize:12,color:T.teal,minWidth:80}}>→ {ac.owner}</span>}</>:<><input value={ac.text} onChange={e=>updItem(m.id,'action',ac.id,{text:e.target.value})} style={{...inpSt,flex:2,padding:'6px 10px',fontSize:13,textDecoration:ac.done?'line-through':'none',color:ac.done?T.ter:T.text}} placeholder="Ação a executar..."/><input value={ac.owner} onChange={e=>updItem(m.id,'action',ac.id,{owner:e.target.value})} style={{...inpSt,width:110,padding:'6px 10px',fontSize:12}} placeholder="Responsável"/></>}
                      {!readOnly&&<button onClick={()=>delItem(m.id,'action',ac.id)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:14,padding:'4px'}}>✕</button>}
                    </div>
                  ))}
                </div>

                <div>
                  <SectionTitle>📝 Observações gerais</SectionTitle>
                  {readOnly?<div style={{...taSt,minHeight:60,lineHeight:1.6,color:T.sec,whiteSpace:'pre-wrap'}}>{m.notes||<span style={{color:T.ter,fontStyle:'italic'}}>Sem observações.</span>}</div>:<textarea style={{...taSt,minHeight:80}} placeholder="Anotações livres, decisões tomadas, observações importantes..." value={m.notes||''} onChange={e=>updMeeting(m.id,{notes:e.target.value})}/>}
                </div>
              </Card>
            })():<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:T.ter,fontSize:13}}>← Selecione uma reunião ou crie uma nova</div>}
          </div>
        </>
      )}

      {/* ── CONFIG ── */}
      {tab==='config'&&!readOnly&&(
        <>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Configurações</h1>
          <div style={{display:'grid',gap:16,maxWidth:700}}>
            <Card>
              <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>🔌 Conexão com o Jira</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                {[{id:'jiraUrl',label:'URL do Jira Cloud *',ph:'https://seudominio.atlassian.net'},{id:'project',label:'Chave do projeto *',ph:'PROJ, SCRUM, ADMOSS...'},{id:'email',label:'E-mail da conta *',ph:'voce@empresa.com',tp:'email'},{id:'token',label:'API Token *',ph:'Token do Atlassian',tp:'password',link:'https://id.atlassian.com/manage-profile/security/api-tokens'}].map(f=>(
                  <div key={f.id} style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.4px'}}>{f.label}</label>
                    <input type={f.tp||'text'} style={{...inpSt,width:'100%'}} placeholder={f.ph} value={cfg[f.id]||''} onChange={e=>setCfg(p=>({...p,[f.id]:e.target.value}))}/>
                    {f.link&&<a href={f.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.teal}}>Gerar token aqui ↗</a>}
                  </div>
                ))}
                <div style={{display:'flex',flexDirection:'column',gap:5,gridColumn:'1/-1'}}>
                  <label style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.4px'}}>JQL personalizado (opcional)</label>
                  <input style={{...inpSt,width:'100%'}} placeholder="sprint in openSprints() AND project = PROJ ORDER BY updated DESC" value={cfg.jql||''} onChange={e=>setCfg(p=>({...p,jql:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <Btn primary onClick={connect} disabled={loading}>{loading?'⏳ Conectando...':'🔌 Conectar Jira'}</Btn>
                <Btn onClick={loadSample}>📦 Dados de exemplo</Btn>
              </div>
              {msg&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,fontSize:13,background:msg.t==='ok'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',color:msg.t==='ok'?'#34D399':'#F87171',border:`1px solid ${msg.t==='ok'?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`}}>{msg.t==='ok'?'✓ ':' ✕ '}{msg.m}</div>}
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>📥 Importar JSON da API</div>
              <p style={{fontSize:13,color:T.sec,marginBottom:12}}>Cole o resultado de <code style={{background:T.card2,padding:'1px 6px',borderRadius:4,fontSize:12,color:T.teal}}>/rest/api/3/search/jql?jql=...</code></p>
              <textarea id="jsin" rows={4} style={{...taSt,fontFamily:'monospace',fontSize:12}} placeholder='{"issues": [...]} ← cole aqui'/>
              <div style={{marginTop:10}}><Btn primary onClick={importJSON}>⬆ Importar JSON</Btn></div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>🔗 Compartilhar com gerente</div>
              <p style={{fontSize:13,color:T.sec,marginBottom:12}}>Gera um link de visualização somente leitura. Qualquer pessoa com o link pode ver os cards e GMUDs sem conseguir editar.</p>
              {cards.length===0?<p style={{fontSize:13,color:T.ter}}>Carregue os cards primeiro.</p>:<Btn primary onClick={shareLink}>{copied?'✓ Link copiado!':'🔗 Gerar link'}</Btn>}
            </Card>
          </div>
        </>
      )}


      {/* ── MODAL BLOQUEADOS ── */}
      {blockedModal&&(
        <div onClick={()=>setBlockedModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,width:'100%',maxWidth:640,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:15,fontWeight:700}}>🔴 Cards Bloqueados / Impedidos</div>
              <button onClick={()=>setBlockedModal(false)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:20}}>✕</button>
            </div>
            <div style={{overflow:'auto',flex:1,padding:'12px 20px'}}>
              {visible.filter(c=>c.status==='Blocked'||c.flagged).length===0
                ? <div style={{color:T.ter,textAlign:'center',padding:24}}>Nenhum card bloqueado 🎉</div>
                : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr>{['Chave','Título','Status','Responsável'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,fontWeight:700,color:T.ter,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {visible.filter(c=>c.status==='Blocked'||c.flagged).map(c=>(
                        <tr key={c.key}>
                          <td style={{padding:'10px',borderBottom:`1px solid ${T.border2}`}}><CardLink k={c.key} jiraUrl={cfg.jiraUrl} style={{fontSize:12,color:'#F87171'}}/>{c.flagged&&<span style={{marginLeft:5,fontSize:9,background:'rgba(245,158,11,.2)',color:'#F59E0B',padding:'1px 4px',borderRadius:3}}>🚩</span>}</td>
                          <td style={{padding:'10px',borderBottom:`1px solid ${T.border2}`,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:T.sec}} title={c.title}>{c.title}</td>
                          <td style={{padding:'10px',borderBottom:`1px solid ${T.border2}`}}><Badge s={c.status}/></td>
                          <td style={{padding:'10px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:T.sec,whiteSpace:'nowrap'}}>{c.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CALENDÁRIO ── */}
      {calModal&&(
        <div onClick={()=>setCalModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,width:'100%',maxWidth:520,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:15,fontWeight:700}}>📅 GMUDs do dia {calModal.day}</div>
              <button onClick={()=>setCalModal(null)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:20}}>✕</button>
            </div>
            <div style={{overflow:'auto',flex:1,padding:'12px 20px',display:'flex',flexDirection:'column',gap:8}}>
              {calModal.events.map(e=>{
                const sc=gsc(e.status)
                return<div key={e.key} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:T.card2,borderRadius:8,border:`1px solid ${e.gmud.executed?'rgba(52,211,153,.3)':T.border}`}}>
                  <CardLink k={e.key} jiraUrl={cfg.jiraUrl} style={{fontSize:12,fontWeight:700,color:e.gmud.executed?'#34D399':sc.tx,whiteSpace:'nowrap'}}/>
                  <span style={{fontSize:12,flex:1,color:T.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={e.title}>{e.title}</span>
                  <Badge s={e.status}/>
                  {e.gmud.executed&&<span style={{fontSize:11,color:'#34D399',whiteSpace:'nowrap'}}>✓ Executada</span>}
                </div>
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PLANNER ── */}
      {tab==='planner'&&!readOnly&&(()=>{
        const today = new Date()
        const dow = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (dow===0?6:dow-1) + plannerWeek*7)
        const weekDays = Array.from({length:7},(_,i)=>{
          const d = new Date(monday); d.setDate(monday.getDate()+i)
          const key = d.toISOString().split('T')[0]
          const label = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
          return {key,label,d}
        })
        const weekKey = weekDays[0].key
        const meta = planner[`meta_${weekKey}`]||{}
        const DAYS_SHORT=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
        const isCurrentWeek = plannerWeek===0
        return(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:700}}>📆 Planner Semanal</h1>
              <p style={{fontSize:13,color:T.ter,marginTop:2}}>{weekDays[0].label} — {weekDays[6].label}{isCurrentWeek&&<span style={{marginLeft:8,fontSize:11,background:'rgba(26,171,138,.15)',color:T.teal,padding:'1px 8px',borderRadius:10}}>Semana atual</span>}</p>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <Btn small onClick={()=>setPlannerWeek(p=>p-1)}>◀ Anterior</Btn>
              {!isCurrentWeek&&<Btn small onClick={()=>setPlannerWeek(0)}>Hoje</Btn>}
              <Btn small onClick={()=>setPlannerWeek(p=>p+1)}>Próxima ▶</Btn>
              <Btn small primary onClick={()=>printPlanner(weekDays,weekKey)}>🖨 PDF</Btn>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:14,alignItems:'start'}}>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
                {weekDays.map((d,i)=>{
                  const isToday=d.key===today.toISOString().split('T')[0]
                  const notes=planner[d.key]?.notes||''
                  return(
                    <div key={d.key} style={{display:'flex',flexDirection:'column',gap:0}}>
                      <div style={{padding:'8px 10px',borderRadius:'8px 8px 0 0',background:isToday?'rgba(26,171,138,.2)':T.card2,border:`1px solid ${isToday?T.teal:T.border}`,borderBottom:'none',textAlign:'center'}}>
                        <div style={{fontSize:11,fontWeight:700,color:isToday?T.teal:T.sec,textTransform:'uppercase',letterSpacing:'.5px'}}>{DAYS_SHORT[i]}</div>
                        <div style={{fontSize:13,fontWeight:isToday?700:400,color:isToday?T.teal:T.text,marginTop:2}}>{d.label}</div>
                      </div>
                      <textarea
                        value={notes}
                        onChange={e=>updPlannerDay(d.key,e.target.value)}
                        placeholder="Tarefas, compromissos..."
                        style={{width:'100%',minHeight:220,padding:'10px',border:`1px solid ${isToday?T.teal:T.border}`,borderRadius:'0 0 8px 8px',background:T.card,color:T.text,fontSize:12,resize:'vertical',outline:'none',lineHeight:1.6,fontFamily:'inherit'}}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <Card style={{padding:'14px 16px'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#FCD34D',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>⭐ Prioridades</div>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:8}}>
                  {(meta.prioridades||[]).map(p=>(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:6}}>
                      <input type="checkbox" checked={p.done} onChange={()=>updPrioridade(weekKey,p.id,{done:!p.done})} style={{width:14,height:14,accentColor:T.teal,cursor:'pointer',flexShrink:0}}/>
                      <input value={p.text} onChange={e=>updPrioridade(weekKey,p.id,{text:e.target.value})} placeholder="Prioridade..." style={{flex:1,background:'transparent',border:'none',borderBottom:`1px solid ${T.border}`,color:p.done?T.ter:T.text,fontSize:12,padding:'3px 0',outline:'none',textDecoration:p.done?'line-through':'none'}}/>
                      <button onClick={()=>delPrioridade(weekKey,p.id)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:13,padding:'0 2px'}}>✕</button>
                    </div>
                  ))}
                  {(meta.prioridades||[]).length===0&&<div style={{fontSize:12,color:T.ter}}>Sem prioridades</div>}
                </div>
                <button onClick={()=>addPrioridade(weekKey)} style={{fontSize:12,color:T.teal,background:'transparent',border:`1px dashed rgba(26,171,138,.4)`,borderRadius:6,padding:'5px 10px',cursor:'pointer',width:'100%'}}>+ Adicionar</button>
              </Card>

              <Card style={{padding:'14px 16px'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#F87171',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>⚠ Importante</div>
                <textarea
                  value={meta.importante||''}
                  onChange={e=>updPlannerField(weekKey,'importante',e.target.value)}
                  placeholder="Lembretes importantes da semana..."
                  style={{width:'100%',minHeight:100,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,padding:'8px 10px',resize:'vertical',outline:'none',lineHeight:1.6,fontFamily:'inherit'}}
                />
              </Card>

              <Card style={{padding:'14px 16px'}}>
                <div style={{fontSize:12,fontWeight:700,color:T.sec,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>📊 Resumo</div>
                {[
                  {label:'GMUDs nesta semana', value:weekDays.filter(d=>Object.values(gmud).some(g=>g.date===d.key)).length, color:T.teal},
                  {label:'Prioridades concluídas', value:`${(meta.prioridades||[]).filter(p=>p.done).length}/${(meta.prioridades||[]).length}`, color:'#34D399'},
                ].map(m=>(
                  <div key={m.label} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:11,color:T.ter}}>{m.label}</span>
                    <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── RETRO ── */}
      {tab==='retro'&&!readOnly&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>🔄 Retrospectiva</h1><p style={{fontSize:13,color:T.ter,marginTop:2}}>Board colaborativo — compartilhe com o time e veja em tempo real</p></div>
          </div>
          {!retroSession?(
            <Card style={{maxWidth:400}}>
              <SectionTitle>Nova retrospectiva</SectionTitle>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:5}}>Título da Sprint</label>
                  <input style={{...inpSt,width:'100%'}} placeholder="Ex: Sprint 12 - Maio 2026" value={retroTitle} onChange={e=>setRetroTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&startRetro()}/>
                </div>
                <Btn primary onClick={startRetro} disabled={!retroTitle.trim()}>▶ Criar retrospectiva</Btn>
              </div>
            </Card>
          ):(
            <div style={{display:'grid',gap:16}}>
              <Card style={{border:`1px solid rgba(26,171,138,.3)`}}>
                <SectionTitle>Sessão ativa — {retroSession.title}</SectionTitle>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  {[
                    {label:'Link para o time',url:`${typeof window!=='undefined'?window.location.origin:''}/retro?session=${retroSession.id}`},
                    {label:'Link do host (você)',url:`${typeof window!=='undefined'?window.location.origin:''}/retro?session=${retroSession.id}&host=1`},
                  ].map(({label,url})=>(
                    <div key={label}>
                      <div style={{fontSize:11,color:T.ter,marginBottom:4}}>{label}</div>
                      <div style={{display:'flex',gap:6}}>
                        <input readOnly value={url} style={{...inpSt,fontSize:11,flex:1}}/>
                        <Btn small onClick={()=>navigator.clipboard.writeText(url)}>📋</Btn>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <Btn onClick={()=>window.open(`/retro?session=${retroSession.id}&host=1`,'_blank')} primary>🚀 Abrir retro</Btn>
                  <Btn onClick={()=>setRetroSession(null)}>+ Nova retro</Btn>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

    </main>
  </div>
  )
}
