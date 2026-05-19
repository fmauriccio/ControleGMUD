import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

// ─── Statuses to HIDE ─────────────────────────────────────────────────────────
const HIDDEN = new Set(['Cancelado','Em Produção','Concluído','Done','Canceled','Em Producao'])

// ─── Status color map ─────────────────────────────────────────────────────────
const SC = {
  'Em Homologação':         { bg:'rgba(249,115,22,.18)',  tx:'#FB923C', dot:'#F97316'  },
  'Code Review':            { bg:'rgba(139,92,246,.18)',  tx:'#A78BFA', dot:'#8B5CF6'  },
  'Aguardando Testes':      { bg:'rgba(59,130,246,.18)',  tx:'#60A5FA', dot:'#3B82F6'  },
  'Em Desenvolvimento':     { bg:'rgba(20,184,166,.18)',  tx:'#2DD4BF', dot:'#14B8A6'  },
  'Aguardando deploy':      { bg:'rgba(245,158,11,.18)',  tx:'#FCD34D', dot:'#F59E0B'  },
  'Itens em Backlog':       { bg:'rgba(100,116,139,.18)', tx:'#94A3B8', dot:'#64748B'  },
  'Em teste':               { bg:'rgba(6,182,212,.18)',   tx:'#22D3EE', dot:'#06B6D4'  },
  'Em Refinamento Técnico': { bg:'rgba(99,102,241,.18)',  tx:'#818CF8', dot:'#6366F1'  },
  'Aguardando Homologação': { bg:'rgba(251,146,60,.18)',  tx:'#FDBA74', dot:'#FB923C'  },
  'Comprometido':           { bg:'rgba(217,70,239,.18)',  tx:'#E879F9', dot:'#D946EF'  },
  'Refinado':               { bg:'rgba(56,189,248,.18)',  tx:'#7DD3FC', dot:'#38BDF8'  },
  'In Progress':            { bg:'rgba(245,158,11,.18)',  tx:'#FCD34D', dot:'#F59E0B'  },
  'To Do':                  { bg:'rgba(59,130,246,.18)',  tx:'#60A5FA', dot:'#3B82F6'  },
  'Blocked':                { bg:'rgba(239,68,68,.18)',   tx:'#F87171', dot:'#EF4444'  },
  'In Review':              { bg:'rgba(139,92,246,.18)',  tx:'#A78BFA', dot:'#8B5CF6'  },
  'Testing':                { bg:'rgba(6,182,212,.18)',   tx:'#22D3EE', dot:'#06B6D4'  },
}
const gsc = (s) => SC[s] || { bg:'rgba(148,163,184,.15)', tx:'#94A3B8', dot:'#64748B' }

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0A0F1E',
  sidebar: '#0D1117',
  card:    '#111827',
  card2:   '#1E293B',
  border:  'rgba(148,163,184,.1)',
  border2: 'rgba(148,163,184,.06)',
  text:    '#E2E8F0',
  sec:     '#94A3B8',
  ter:     '#475569',
  green:   '#10B981',
  greenDk: '#059669',
  teal:    '#1AAB8A',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const fd = (d) => { const x=new Date(); x.setDate(x.getDate()+d); return x.toISOString().split('T')[0] }
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
  'PROJ-104':{date:fd(2),executed:false},
  'PROJ-107':{date:fd(6),executed:false},
  'PROJ-110':{date:fd(14),executed:false},
  'PROJ-101':{date:fd(21),executed:false},
  'PROJ-106':{date:fd(28),executed:false},
}

// ─── Encode/decode for sharing ────────────────────────────────────────────────
function encodeShare(cards, gmud) {
  try {
    const d = JSON.stringify({ cards: cards.map(c=>({k:c.key,t:c.title,s:c.status,a:c.assignee})), gmud })
    const bytes = new TextEncoder().encode(d)
    return btoa(String.fromCharCode(...bytes))
  } catch { return '' }
}
function decodeShare(s) {
  try {
    const bytes = Uint8Array.from(atob(s), c=>c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch { return null }
}

// ─── Day label ────────────────────────────────────────────────────────────────
function dayTag(ds) {
  const diff = Math.ceil((new Date(ds+'T00:00:00') - new Date()) / 864e5)
  if (diff < 0)  return {lbl:`${Math.abs(diff)}d atrás`, bg:'rgba(239,68,68,.2)',   tx:'#F87171'}
  if (diff===0)  return {lbl:'Hoje!',                    bg:'rgba(245,158,11,.25)', tx:'#FCD34D'}
  if (diff===1)  return {lbl:'Amanhã',                   bg:'rgba(245,158,11,.2)',  tx:'#FCD34D'}
  if (diff<=7)   return {lbl:`em ${diff}d`,              bg:'rgba(245,158,11,.15)', tx:'#FCD34D'}
  return              {lbl:`em ${diff}d`,                bg:'rgba(16,185,129,.15)', tx:'#34D399'}
}

// ─── Components ───────────────────────────────────────────────────────────────
function Badge({ s }) {
  const c = gsc(s)
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:c.bg,color:c.tx,whiteSpace:'nowrap'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:c.dot,flexShrink:0}}/>
      {s}
    </span>
  )
}

function Card({ children, style }) {
  return <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:'18px 20px',...style}}>{children}</div>
}

function Metric({ label, value, color, sub }) {
  return (
    <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 18px'}}>
      <div style={{fontSize:11,color:T.ter,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:color||T.text,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:11,color:T.ter,marginTop:4}}>{sub}</div>}
    </div>
  )
}

function Btn({ children, primary, small, onClick, disabled, style={} }) {
  const base = {display:'inline-flex',alignItems:'center',gap:6,border:'none',borderRadius:8,cursor:disabled?'not-allowed':'pointer',fontWeight:500,transition:'all .15s',opacity:disabled?.6:1,...style}
  const sz   = small ? {padding:'6px 12px',fontSize:12} : {padding:'9px 18px',fontSize:13}
  const col  = primary ? {background:`linear-gradient(135deg,${T.teal},${T.green})`,color:'#fff'} : {background:T.card2,color:T.sec,border:`1px solid ${T.border}`}
  return <button style={{...base,...sz,...col}} onClick={onClick} disabled={disabled}>{children}</button>
}

const TT = ({ contentStyle, ...p }) => (
  <Tooltip {...p} contentStyle={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.text, ...contentStyle }} />
)

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,    setTab]    = useState('dashboard')
  const [cards,  setCards]  = useState([])
  const [gmud,   setGmud]   = useState({})
  const [cfg,    setCfg]    = useState({jiraUrl:'',email:'',token:'',project:'',jql:''})
  const [loading,setLoading]= useState(false)
  const [msg,    setMsg]    = useState(null)
  const [fTxt,   setFTxt]   = useState('')
  const [fSt,    setFSt]    = useState('')
  const [saved,  setSaved]  = useState(false)
  const [shared, setShared] = useState(false)
  const [readOnly,setRO]    = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Check for share param
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('share')
    if (shareData) {
      const d = decodeShare(shareData)
      if (d) {
        const loaded = d.cards.map(c=>({key:c.k,title:c.t,status:c.s,assignee:c.a}))
        setCards(loaded)
        setGmud(d.gmud||{})
        setRO(true)
        return
      }
    }
    try {
      const c = localStorage.getItem('gmud-cfg');    if(c) setCfg(JSON.parse(c))
      const g = localStorage.getItem('gmud-gmud');   if(g) setGmud(JSON.parse(g))
      const k = localStorage.getItem('gmud-cards');  if(k) setCards(JSON.parse(k))
    } catch {}
  }, [])

  const save = useCallback((nc, ng, nf) => {
    try {
      if(nc!==undefined) localStorage.setItem('gmud-cards',JSON.stringify(nc))
      if(ng!==undefined) localStorage.setItem('gmud-gmud', JSON.stringify(ng))
      if(nf!==undefined) localStorage.setItem('gmud-cfg',  JSON.stringify(nf))
    } catch {}
  }, [])

  const proc = useCallback((issues, gOver) => {
    const g = gOver??gmud
    const p = issues
      .filter(i => !HIDDEN.has(i.fields?.status?.name))
      .map(i => ({key:i.key, title:i.fields?.summary||'', status:i.fields?.status?.name||'To Do', assignee:i.fields?.assignee?.displayName||'—'}))
    setCards(p); save(p,undefined,undefined)
  }, [gmud, save])

  const connect = async () => {
    if(!cfg.jiraUrl||!cfg.email||!cfg.token||!cfg.project){setMsg({t:'err',m:'Preencha todos os campos.'});return}
    setLoading(true); setMsg(null)
    const jql = cfg.jql||`project = ${cfg.project} ORDER BY updated DESC`
    try {
      const r = await fetch('/api/jira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jiraUrl:cfg.jiraUrl,email:cfg.email,token:cfg.token,jql,maxResults:200})})
      const d = await r.json()
      if(!r.ok) throw new Error(d.error||'Erro')
      proc(d.issues||[])
      save(undefined,undefined,cfg)
      setMsg({t:'ok',m:`${d.issues?.length||0} cards carregados!`})
    } catch(e){setMsg({t:'err',m:e.message})}
    finally{setLoading(false)}
  }

  const importJSON = () => {
    const raw = document.getElementById('jsin')?.value?.trim()
    if(!raw) return
    try{
      const p=JSON.parse(raw); const iss=p.issues||p
      if(!Array.isArray(iss)) throw new Error('Array esperado')
      proc(iss); setMsg({t:'ok',m:`${iss.length} cards importados!`})
    } catch(e){setMsg({t:'err',m:'JSON inválido: '+e.message})}
  }

  const loadSample = () => { setGmud(SAMPLE_GMUD); save(undefined,SAMPLE_GMUD,undefined); proc(SAMPLE,SAMPLE_GMUD); setTab('dashboard') }

  const upGmud = (key, field, val) => {
    const ng = {...gmud,[key]:{...(gmud[key]||{executed:false}),[field]:val}}
    setGmud(ng); save(undefined,ng,undefined)
  }
  const toggleDone = (key) => upGmud(key,'executed',!gmud[key]?.executed)

  const saveAll = () => { save(cards,gmud,cfg); setSaved(true); setTimeout(()=>setSaved(false),2000) }

  const shareLink = () => {
    const enc = encodeShare(cards, gmud)
    const url = `${window.location.origin}/?share=${enc}`
    navigator.clipboard.writeText(url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000)})
  }

  const exportCSV = () => {
    const rows = [['Chave','Título','Status','Responsável','Data GMUD','Executada']]
    cards.filter(c=>gmud[c.key]?.date).forEach(c=>{
      const g=gmud[c.key]||{}
      rows.push([c.key,c.title,c.status,c.assignee,g.date||'',g.executed?'Sim':'Não'])
    })
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'})); a.download=`gmud_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const now       = new Date()
  const visible   = cards.filter(c => !HIDDEN.has(c.status))
  const statuses  = [...new Set(visible.map(c=>c.status))].sort()

  const sorted = [...visible]
    .filter(c => {
      const q = fTxt.toLowerCase()
      return (!q || c.key.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q))
          && (!fSt || c.status===fSt)
    })
    .sort((a,b) => {
      const ga=gmud[a.key]||{}, gb=gmud[b.key]||{}
      if(ga.executed && !gb.executed) return 1
      if(!ga.executed && gb.executed) return -1
      if(ga.date && gb.date) return ga.date.localeCompare(gb.date)
      if(ga.date) return -1; if(gb.date) return 1
      return 0
    })

  const stCounts = visible.reduce((a,c)=>{a[c.status]=(a[c.status]||0)+1;return a},{})
  const pie      = Object.entries(stCounts).map(([n,v])=>({name:n,value:v,fill:gsc(n).dot}))
  const asgn     = Object.entries(visible.reduce((a,c)=>{if(c.assignee!=='—')a[c.assignee]=(a[c.assignee]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,v])=>({name:n.split(' ')[0],value:v}))
  const asnColors= ['#10B981','#60A5FA','#A78BFA','#F97316','#F87171','#FCD34D','#2DD4BF','#E879F9']

  const gmudPend  = visible.filter(c=>gmud[c.key]?.date && !gmud[c.key]?.executed && new Date(gmud[c.key].date+'T00:00:00')>=now).length
  const gmudDone  = visible.filter(c=>gmud[c.key]?.executed).length
  const upcoming  = [...visible].filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).sort((a,b)=>gmud[a.key].date.localeCompare(gmud[b.key].date)).slice(0,8)

  const monthBar = (() => {
    const m={}
    for(let i=-1;i<=4;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);m[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`]=0}
    visible.filter(c=>gmud[c.key]?.date&&!gmud[c.key]?.executed).forEach(c=>{const mo=gmud[c.key].date.substring(0,7);if(mo in m)m[mo]++})
    const cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    return Object.entries(m).map(([k,v])=>{const[y,mo]=k.split('-');return{name:new Date(+y,+mo-1,1).toLocaleString('pt-BR',{month:'short',year:'2-digit'}),value:v,cur:k===cm}})
  })()

  // ── Layout ───────────────────────────────────────────────────────────────────
  const navItems = [
    {id:'dashboard', icon:'📊', label:'Dashboard'},
    {id:'cards',     icon:'🗂',  label:'Cards / GMUDs'},
    ...(!readOnly ? [{id:'config', icon:'⚙️', label:'Configurações'}] : []),
  ]

  const inpSt = {padding:'9px 12px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13,outline:'none'}
  const selSt = {padding:'9px 10px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13}

  return (
    <div style={{display:'flex',minHeight:'100vh',background:T.bg}}>

      {/* ── SIDEBAR ── */}
      <aside style={{width:220,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',padding:'24px 0',flexShrink:0,position:'sticky',top:0,height:'100vh'}}>
        <div style={{padding:'0 20px',marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.teal},${T.green})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>G</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:T.text}}>GMUD</div>
              <div style={{fontSize:10,color:T.ter}}>Scrum Master Tool</div>
            </div>
          </div>
        </div>

        {readOnly && (
          <div style={{margin:'0 12px 20px',padding:'8px 12px',borderRadius:8,background:'rgba(16,185,129,.12)',border:`1px solid rgba(16,185,129,.25)`,fontSize:11,color:'#34D399',lineHeight:1.4}}>
            👁 Modo visualização<br/><span style={{color:T.ter}}>Somente leitura</span>
          </div>
        )}

        <nav style={{flex:1,padding:'0 12px',display:'flex',flexDirection:'column',gap:4}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===n.id?600:400,background:tab===n.id?`rgba(16,185,129,.15)`:' transparent',color:tab===n.id?T.green:T.sec,textAlign:'left',transition:'all .15s'}}>
              <span style={{fontSize:16}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {!readOnly && cards.length>0 && (
          <div style={{padding:'0 12px',marginTop:'auto'}}>
            <button onClick={shareLink} style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1px solid ${T.border}`,background:'transparent',color:copied?'#34D399':T.sec,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:8,transition:'all .15s'}}>
              <span>{copied?'✓':'🔗'}</span>{copied?'Link copiado!':'Compartilhar'}
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={{flex:1,padding:'28px 32px',overflowY:'auto',minWidth:0}}>

        {/* ── DASHBOARD ── */}
        {tab==='dashboard' && (
          visible.length===0
            ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}>
                <div style={{fontSize:48}}>📋</div>
                <div style={{fontSize:18,fontWeight:600}}>Nenhum dado carregado</div>
                <div style={{fontSize:13,color:T.sec,marginBottom:8}}>Configure o Jira ou veja um exemplo</div>
                <div style={{display:'flex',gap:8}}>
                  <Btn primary onClick={()=>setTab('config')}>Configurar Jira</Btn>
                  <Btn onClick={loadSample}>📦 Ver exemplo</Btn>
                </div>
              </div>
            : <>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:22,fontWeight:700,color:T.text}}>Dashboard</h1>
                    <p style={{fontSize:13,color:T.ter,marginTop:2}}>{visible.length} cards ativos</p>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:24}}>
                  <Metric label="Total de cards"    value={visible.length}  color='#60A5FA' />
                  <Metric label="GMUDs pendentes"   value={gmudPend}        color={T.teal}  />
                  <Metric label="GMUDs executadas"  value={gmudDone}        color='#34D399' />
                  <Metric label="Bloqueados"         value={stCounts['Blocked']||0} color='#F87171' />
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
                  <Card>
                    <div style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>Cards por status</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} stroke="none">
                          {pie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:11,color:T.sec}}>{v}</span>}/>
                        <TT/>
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card>
                    <div style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>Cards por responsável</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={asgn} layout="vertical" margin={{left:0,right:16}}>
                        <XAxis type="number" tick={{fontSize:11,fill:T.ter}} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:T.sec}} width={60} axisLine={false} tickLine={false}/>
                        <TT/>
                        <Bar dataKey="value" name="Cards" radius={[0,4,4,0]}>
                          {asgn.map((_,i)=><Cell key={i} fill={asnColors[i%asnColors.length]}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card style={{gridColumn:'1/-1'}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>GMUDs agendadas por mês</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={monthBar} margin={{top:4}}>
                        <XAxis dataKey="name" tick={{fontSize:11,fill:T.sec}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:11,fill:T.ter}} allowDecimals={false} axisLine={false} tickLine={false}/>
                        <TT/>
                        <Bar dataKey="value" name="GMUDs" radius={[4,4,0,0]}>
                          {monthBar.map((e,i)=><Cell key={i} fill={e.cur?T.teal:'rgba(26,171,138,.3)'}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Próximas GMUDs</h2>
                {upcoming.length===0
                  ? <p style={{color:T.ter,fontSize:13}}>Nenhuma GMUD agendada. Defina datas na aba Cards / GMUDs.</p>
                  : <div style={{display:'grid',gap:8}}>
                      {upcoming.map(c=>{
                        const g=gmud[c.key]||{}, dt=dayTag(g.date)
                        const fmt=new Date(g.date+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
                        return (
                          <div key={c.key} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:T.card,border:`1px solid ${T.border}`,borderRadius:10,flexWrap:'wrap'}}>
                            <span style={{fontSize:12,fontWeight:600,color:T.teal,minWidth:105}}>📅 {fmt}</span>
                            <span style={{fontSize:12,fontWeight:700,color:T.ter,minWidth:80}}>{c.key}</span>
                            <span style={{fontSize:13,flex:1,color:T.text,minWidth:120}}>{c.title.length>55?c.title.slice(0,55)+'…':c.title}</span>
                            <Badge s={c.status}/>
                            <span style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontWeight:600,background:dt.bg,color:dt.tx}}>{dt.lbl}</span>
                          </div>
                        )
                      })}
                    </div>
                }
              </>
        )}

        {/* ── CARDS / GMUDs ── */}
        {tab==='cards' && (
          visible.length===0
            ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}>
                <div style={{fontSize:48}}>🗂</div>
                <div style={{fontSize:16,fontWeight:500}}>Nenhum card carregado</div>
                <div style={{display:'flex',gap:8}}>
                  <Btn primary onClick={()=>setTab('config')}>Configurar Jira</Btn>
                  <Btn onClick={loadSample}>📦 Carregar exemplo</Btn>
                </div>
              </div>
            : <>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:22,fontWeight:700,color:T.text}}>Cards / GMUDs</h1>
                    <p style={{fontSize:13,color:T.ter,marginTop:2}}>Ordenado por data mais próxima</p>
                  </div>
                  {!readOnly && (
                    <div style={{display:'flex',gap:8'}}>
                      <Btn small onClick={exportCSV}>⬇ CSV</Btn>
                      <Btn small primary onClick={saveAll} style={{background:saved?`linear-gradient(135deg,#059669,#047857)`:`linear-gradient(135deg,${T.teal},${T.green})`}}>{saved?'✓ Salvo!':'💾 Salvar'}</Btn>
                    </div>
                  )}
                </div>

                <Card style={{padding:'16px 20px'}}>
                  <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                    <input style={{...inpSt,flex:1,minWidth:180}} placeholder="Buscar por chave, título ou responsável..." value={fTxt} onChange={e=>setFTxt(e.target.value)}/>
                    <select style={selSt} value={fSt} onChange={e=>setFSt(e.target.value)}>
                      <option value="">Todos os status</option>
                      {statuses.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                      <thead>
                        <tr>
                          {['Chave','Título','Status','Responsável','Data GMUD',...(!readOnly?['✓']:['Situação'])].map(h=>(
                            <th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:10,fontWeight:700,color:T.ter,borderBottom:`1px solid ${T.border}`,textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map(c=>{
                          const g=gmud[c.key]||{}, done=!!g.executed
                          return (
                            <tr key={c.key} style={{background:done?'transparent':g.date?'rgba(26,171,138,.04)':'transparent',opacity:done?.45:1,transition:'all .2s'}}>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`,whiteSpace:'nowrap'}}>
                                {cfg.jiraUrl
                                  ? <a href={`${cfg.jiraUrl}/browse/${c.key}`} target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:700,color:done?T.ter:T.teal,textDecoration:done?'line-through':'none'}}>{c.key}</a>
                                  : <span style={{fontSize:12,fontWeight:700,color:done?T.ter:T.teal,textDecoration:done?'line-through':'none'}}>{c.key}</span>}
                              </td>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`,maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:done?T.ter:T.text,textDecoration:done?'line-through':'none'}} title={c.title}>{c.title}</td>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`,whiteSpace:'nowrap'}}><Badge s={c.status}/></td>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`,fontSize:12,color:T.sec,whiteSpace:'nowrap'}}>{c.assignee}</td>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`}}>
                                {readOnly
                                  ? <span style={{fontSize:12,color:g.date?T.text:T.ter}}>{g.date?new Date(g.date+'T00:00:00').toLocaleDateString('pt-BR'):'-'}</span>
                                  : <input type="date" value={g.date||''} onChange={e=>upGmud(c.key,'date',e.target.value)} disabled={done}
                                      style={{fontSize:12,padding:'5px 8px',borderRadius:7,border:`1px solid ${T.border}`,background:T.card2,color:T.text,width:140,opacity:done?.5:1}}/>}
                              </td>
                              <td style={{padding:'11px 12px',borderBottom:`1px solid ${T.border2}`,textAlign:'center'}}>
                                {readOnly
                                  ? <span style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontWeight:600,background:done?'rgba(52,211,153,.15)':'rgba(148,163,184,.1)',color:done?'#34D399':T.ter}}>{done?'✓ Executada':'Pendente'}</span>
                                  : <button onClick={()=>toggleDone(c.key)} title={done?'Desfazer':'Marcar como executada'}
                                      style={{width:30,height:30,borderRadius:8,border:`1.5px solid ${done?'rgba(52,211,153,.5)':T.border}`,background:done?'rgba(52,211,153,.15)':'transparent',color:done?'#34D399':T.ter,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                                      {done?'✓':'○'}
                                    </button>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {sorted.length===0 && <div style={{textAlign:'center',padding:'28px',color:T.ter,fontSize:13}}>Nenhum card encontrado.</div>}
                  </div>
                </Card>
              </>
        )}

        {/* ── CONFIG ── */}
        {tab==='config' && !readOnly && (
          <>
            <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Configurações</h1>

            <div style={{display:'grid',gap:16,maxWidth:700}}>
              <Card>
                <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.text}}>🔌 Conexão com o Jira</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                  {[
                    {id:'jiraUrl',label:'URL do Jira Cloud *',    ph:'https://seudominio.atlassian.net'},
                    {id:'project',label:'Chave do projeto *',      ph:'PROJ, SCRUM, ADMOSS...'},
                    {id:'email',  label:'E-mail da conta *',       ph:'voce@empresa.com',type:'email'},
                    {id:'token',  label:'API Token *',             ph:'Token do Atlassian', type:'password',link:'https://id.atlassian.com/manage-profile/security/api-tokens'},
                  ].map(f=>(
                    <div key={f.id} style={{display:'flex',flexDirection:'column',gap:5}}>
                      <label style={{fontSize:11,fontWeight:700,color:T.ter,textTransform:'uppercase',letterSpacing:'.4px'}}>{f.label}</label>
                      <input type={f.type||'text'} style={{...inpSt,width:'100%'}} placeholder={f.ph} value={cfg[f.id]||''} onChange={e=>setCfg(p=>({...p,[f.id]:e.target.value}))}/>
                      {f.link && <a href={f.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.teal}}>Gerar token aqui ↗</a>}
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
                {msg && (
                  <div style={{marginTop:12,padding:'10px 14px',borderRadius:8,fontSize:13,
                    background:msg.t==='ok'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',
                    color:msg.t==='ok'?'#34D399':'#F87171',
                    border:`1px solid ${msg.t==='ok'?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`}}>
                    {msg.t==='ok'?'✓ ':' ✕ '}{msg.m}
                  </div>
                )}
              </Card>

              <Card>
                <div style={{fontSize:14,fontWeight:600,marginBottom:8,color:T.text}}>📥 Importar JSON da API</div>
                <p style={{fontSize:13,color:T.sec,marginBottom:12}}>Cole o resultado de <code style={{background:T.card2,padding:'1px 6px',borderRadius:4,fontSize:12,color:T.teal}}>/rest/api/3/search/jql?jql=...</code></p>
                <textarea id="jsin" rows={5} style={{width:'100%',padding:10,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:'monospace',fontSize:12,resize:'vertical',background:T.card2,color:T.text}} placeholder='{"issues": [...]} ← cole aqui'/>
                <div style={{marginTop:10}}><Btn primary onClick={importJSON}>⬆ Importar JSON</Btn></div>
              </Card>

              <Card>
                <div style={{fontSize:14,fontWeight:600,marginBottom:8,color:T.text}}>🔗 Compartilhar com gerente</div>
                <p style={{fontSize:13,color:T.sec,marginBottom:12}}>Gera um link de visualização somente leitura com todos os cards e GMUDs atuais. Qualquer pessoa com o link pode ver, mas não editar.</p>
                {cards.length===0
                  ? <p style={{fontSize:13,color:T.ter}}>Carregue os cards primeiro.</p>
                  : <Btn primary onClick={shareLink}>{copied?'✓ Link copiado!':'🔗 Gerar link de compartilhamento'}</Btn>}
              </Card>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
