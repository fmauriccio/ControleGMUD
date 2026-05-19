// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'Em Homologação':        { bg: 'rgba(249,115,22,0.18)',  color: '#FB923C', dot: '#F97316' },
  'Code Review':           { bg: 'rgba(167,139,250,0.18)', color: '#A78BFA', dot: '#8B5CF6' },
  'Aguardando Testes':     { bg: 'rgba(96,165,250,0.18)',  color: '#60A5FA', dot: '#3B82F6' },
  'Concluído':             { bg: 'rgba(74,222,128,0.18)',  color: '#4ADE80', dot: '#22C55E' },
  'Em Desenvolvimento':    { bg: 'rgba(45,212,191,0.18)',  color: '#2DD4BF', dot: '#14B8A6' },
  'Aguardando deploy':     { bg: 'rgba(251,191,36,0.18)',  color: '#FBBF24', dot: '#F59E0B' },
  'Itens em Backlog':      { bg: 'rgba(156,163,175,0.18)', color: '#9CA3AF', dot: '#6B7280' },
  'Em teste':              { bg: 'rgba(34,211,238,0.18)',  color: '#22D3EE', dot: '#06B6D4' },
  'Em Refinamento Técnico':{ bg: 'rgba(129,140,248,0.18)', color: '#818CF8', dot: '#6366F1' },
  'Em Produção':           { bg: 'rgba(134,239,172,0.18)', color: '#86EFAC', dot: '#4ADE80' },
  'Cancelado':             { bg: 'rgba(248,113,113,0.18)', color: '#F87171', dot: '#EF4444' },
  'Aguardando Homologação':{ bg: 'rgba(253,186,116,0.18)', color: '#FDBA74', dot: '#FB923C' },
  'Comprometido':          { bg: 'rgba(232,121,249,0.18)', color: '#E879F9', dot: '#D946EF' },
  'Refinado':              { bg: 'rgba(125,211,252,0.18)', color: '#7DD3FC', dot: '#38BDF8' },
  'In Progress':           { bg: 'rgba(251,191,36,0.18)',  color: '#FBBF24', dot: '#F59E0B' },
  'To Do':                 { bg: 'rgba(96,165,250,0.18)',  color: '#60A5FA', dot: '#3B82F6' },
  'Done':                  { bg: 'rgba(74,222,128,0.18)',  color: '#4ADE80', dot: '#22C55E' },
  'Blocked':               { bg: 'rgba(248,113,113,0.18)', color: '#F87171', dot: '#EF4444' },
  'In Review':             { bg: 'rgba(167,139,250,0.18)', color: '#A78BFA', dot: '#8B5CF6' },
  'Testing':               { bg: 'rgba(34,211,238,0.18)',  color: '#22D3EE', dot: '#06B6D4' },
}
const getStatus = (s) => STATUS_CFG[s] || { bg: 'rgba(255,255,255,0.08)', color: '#9CA3AF', dot: '#6B7280' }

// ─── Dark theme tokens ────────────────────────────────────────────────────────
const C = {
  bg:       '#0D1117',
  surface:  '#161B22',
  surface2: '#21262D',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.04)',
  text:     '#E6EDF3',
  textSec:  '#8B949E',
  textTer:  '#6E7681',
  teal:     '#1AAB8A',
  tealDim:  'rgba(26,171,138,0.15)',
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_ISSUES = [
  { key: 'PROJ-101', fields: { summary: 'Implementar autenticação SSO', status: { name: 'Em Homologação' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-102', fields: { summary: 'Refatorar módulo de pagamentos', status: { name: 'To Do' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-103', fields: { summary: 'Corrigir bug no relatório mensal', status: { name: 'Blocked' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Bug' } } },
  { key: 'PROJ-104', fields: { summary: 'Migrar banco de dados para v2', status: { name: 'Em Desenvolvimento' }, assignee: { displayName: 'Rafael Costa' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-105', fields: { summary: 'Atualizar dependências do frontend', status: { name: 'Concluído' }, assignee: { displayName: 'Juliana Rocha' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-106', fields: { summary: 'Implementar cache Redis', status: { name: 'Code Review' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-107', fields: { summary: 'Deploy da API v3.0 em produção', status: { name: 'Aguardando Testes' }, assignee: { displayName: 'Rafael Costa' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-108', fields: { summary: 'Criar testes de integração E2E', status: { name: 'Em Refinamento Técnico' }, assignee: { displayName: 'Juliana Rocha' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-109', fields: { summary: 'Rollout feature flags de segurança', status: { name: 'Concluído' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-110', fields: { summary: 'Configurar pipeline CI/CD', status: { name: 'Em Homologação' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Story' } } },
]

const futureDate = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0] }

const SAMPLE_GMUD = {
  'PROJ-104': { date: futureDate(3),  env: 'Produção',     executed: false },
  'PROJ-107': { date: futureDate(8),  env: 'Produção',     executed: false },
  'PROJ-110': { date: futureDate(15), env: 'Homologação',  executed: false },
  'PROJ-101': { date: futureDate(22), env: 'Produção',     executed: false },
  'PROJ-106': { date: futureDate(30), env: 'Homologação',  executed: false },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDayTag = (dateStr) => {
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / 864e5)
  if (diff < 0)  return { label: `${Math.abs(diff)}d atrás`, bg: 'rgba(248,113,113,0.18)', color: '#F87171' }
  if (diff === 0) return { label: 'Hoje!',    bg: 'rgba(251,191,36,0.25)', color: '#FBBF24' }
  if (diff === 1) return { label: 'Amanhã',   bg: 'rgba(251,191,36,0.18)', color: '#FBBF24' }
  if (diff <= 7)  return { label: `em ${diff}d`, bg: 'rgba(251,191,36,0.18)', color: '#FBBF24' }
  return { label: `em ${diff}d`, bg: 'rgba(74,222,128,0.18)', color: '#4ADE80' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = getStatus(status)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function Alert({ type = 'info', children }) {
  const cfg = {
    info:  { bg: 'rgba(96,165,250,0.1)',   color: '#60A5FA', border: 'rgba(96,165,250,0.2)'  },
    warn:  { bg: 'rgba(251,191,36,0.1)',   color: '#FBBF24', border: 'rgba(251,191,36,0.2)'  },
    ok:    { bg: 'rgba(74,222,128,0.1)',   color: '#4ADE80', border: 'rgba(74,222,128,0.2)'  },
    err:   { bg: 'rgba(248,113,113,0.1)',  color: '#F87171', border: 'rgba(248,113,113,0.2)' },
  }
  const t = cfg[type] || cfg.info
  const icons = { info: 'ℹ', warn: '⚠', ok: '✓', err: '✕' }
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: t.bg, color: t.color, border: `1px solid ${t.border}`, marginBottom: 16, display: 'flex', gap: 8 }}>
      <span style={{ flexShrink: 0 }}>{icons[type]}</span>
      <div style={{ color: C.textSec }}>{children}</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab]       = useState('dashboard')
  const [cards, setCards]   = useState([])
  const [gmud, setGmud]     = useState({})
  const [config, setConfig] = useState({ jiraUrl: '', email: '', token: '', project: '', jql: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    try {
      const c = localStorage.getItem('gmud-config'); if (c) setConfig(JSON.parse(c))
      const g = localStorage.getItem('gmud-gmud');   if (g) setGmud(JSON.parse(g))
      const k = localStorage.getItem('gmud-cards');  if (k) setCards(JSON.parse(k))
    } catch {}
  }, [])

  const persist = useCallback((newCards, newGmud, newConfig) => {
    try {
      if (newCards  !== undefined) localStorage.setItem('gmud-cards',  JSON.stringify(newCards))
      if (newGmud   !== undefined) localStorage.setItem('gmud-gmud',   JSON.stringify(newGmud))
      if (newConfig !== undefined) localStorage.setItem('gmud-config', JSON.stringify(newConfig))
    } catch {}
  }, [])

  const processIssues = useCallback((issues, gOverride) => {
    const g = gOverride ?? gmud
    const processed = issues.map(i => ({
      key:      i.key,
      title:    i.fields?.summary || '',
      status:   i.fields?.status?.name || 'To Do',
      assignee: i.fields?.assignee?.displayName || '—',
      type:     i.fields?.issuetype?.name || 'Task',
    }))
    setCards(processed)
    persist(processed, undefined, undefined)
    return processed
  }, [gmud, persist])

  const connectJira = async () => {
    if (!config.jiraUrl || !config.email || !config.token || !config.project) {
      setStatus({ type: 'err', msg: 'Preencha todos os campos obrigatórios.' }); return
    }
    setLoading(true); setStatus(null)
    const jql = config.jql || `project = ${config.project} ORDER BY updated DESC`
    try {
      const res  = await fetch('/api/jira', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jiraUrl: config.jiraUrl, email: config.email, token: config.token, jql, maxResults: 100 }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      processIssues(data.issues || [])
      persist(undefined, undefined, config)
      setStatus({ type: 'ok', msg: `${data.issues?.length || 0} cards carregados com sucesso!` })
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    } finally { setLoading(false) }
  }

  const importJSON = () => {
    const raw = document.getElementById('json-input')?.value?.trim()
    if (!raw) return
    try {
      const p = JSON.parse(raw)
      const issues = p.issues || p
      if (!Array.isArray(issues)) throw new Error('Precisa ser um array de issues')
      processIssues(issues)
      setStatus({ type: 'ok', msg: `${issues.length} cards importados!` })
    } catch (e) { setStatus({ type: 'err', msg: 'JSON inválido: ' + e.message }) }
  }

  const loadSample = () => {
    setGmud(SAMPLE_GMUD)
    persist(undefined, SAMPLE_GMUD, undefined)
    processIssues(SAMPLE_ISSUES, SAMPLE_GMUD)
    setStatus({ type: 'ok', msg: 'Dados de exemplo carregados!' })
    setTab('dashboard')
  }

  const updateGmud = (key, field, value) => {
    const newGmud = { ...gmud, [key]: { ...(gmud[key] || { env: 'Produção', executed: false }), [field]: value } }
    setGmud(newGmud)
    persist(undefined, newGmud, undefined)
  }

  const toggleExecuted = (key) => {
    const cur = gmud[key]?.executed || false
    updateGmud(key, 'executed', !cur)
  }

  const saveAll = () => { persist(cards, gmud, config); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const exportCSV = () => {
    const rows = [['Chave','Título','Status','Responsável','Data GMUD','Ambiente','Executada']]
    cards.filter(c => gmud[c.key]?.date).forEach(c => {
      const g = gmud[c.key] || {}
      rows.push([c.key, c.title, c.status, c.assignee, g.date||'', g.env||'', g.executed?'Sim':'Não'])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `gmud_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Sort: with date (not executed) → by date asc; no date; executed last
  const sortedCards = [...cards].filter(c => {
    const q = filterText.toLowerCase()
    return (!q || c.key.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q))
      && (!filterStatus || c.status === filterStatus)
  }).sort((a, b) => {
    const ga = gmud[a.key] || {}, gb = gmud[b.key] || {}
    const aEx = ga.executed, bEx = gb.executed
    if (aEx && !bEx) return 1
    if (!aEx && bEx) return -1
    if (ga.date && gb.date) return ga.date.localeCompare(gb.date)
    if (ga.date) return -1
    if (gb.date) return 1
    return 0
  })

  // Dashboard data
  const now = new Date()
  const statusCounts  = cards.reduce((a,c) => { a[c.status]=(a[c.status]||0)+1; return a }, {})
  const assigneeCounts= cards.reduce((a,c) => { if(c.assignee!=='—') a[c.assignee]=(a[c.assignee]||0)+1; return a }, {})
  const pieData       = Object.entries(statusCounts).map(([name,value]) => ({ name, value, color: getStatus(name).dot }))
  const barData       = Object.entries(assigneeCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({ name: name.split(' ')[0], value }))
  const gmudCount     = cards.filter(c => gmud[c.key]?.date && new Date(gmud[c.key].date+'T00:00:00') >= now && !gmud[c.key]?.executed).length
  const executedCount = cards.filter(c => gmud[c.key]?.executed).length

  const monthData = (() => {
    const m = {}
    for (let i=-1; i<=4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth()+i, 1)
      m[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = 0
    }
    cards.filter(c => gmud[c.key]?.date && !gmud[c.key]?.executed).forEach(c => {
      const mo = gmud[c.key].date.substring(0,7)
      if (mo in m) m[mo]++
    })
    const cm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    return Object.entries(m).map(([key,value]) => {
      const [y,mo] = key.split('-')
      return { name: new Date(+y,+mo-1,1).toLocaleString('pt-BR',{month:'short',year:'2-digit'}), value, isCurrent: key===cm }
    })
  })()

  const upcomingGmuds = cards
    .filter(c => gmud[c.key]?.date && !gmud[c.key]?.executed)
    .sort((a,b) => gmud[a.key].date.localeCompare(gmud[b.key].date))
    .slice(0,8)

  // ─── Styles (inline dark) ──────────────────────────────────────────────────
  const card  = { background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }
  const input = { padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.surface2, color: C.text, outline: 'none', width: '100%' }
  const btn   = (primary) => ({ padding: '8px 16px', borderRadius: 8, border: `1px solid ${primary ? C.teal : C.border}`, background: primary ? C.teal : C.surface2, color: primary ? '#fff' : C.text, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s' })
  const btnSm = (primary) => ({ ...btn(primary), padding: '6px 12px', fontSize: 12 })

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1AAB8A,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:700 }}>G</div>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:C.text }}>GMUD Manager</div>
            <div style={{ fontSize:11, color:C.textTer }}>Integração Jira para Scrum Masters</div>
          </div>
        </div>
        <div style={{ display:'flex', background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4, gap:2 }}>
          {['dashboard','cards','config'].map((t,i) => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 16px', borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t?500:400, background:tab===t?C.teal:'transparent', color:tab===t?'#fff':C.textSec, transition:'all .15s' }}>
              {['📊 Dashboard','🗂 Cards / GMUDs','⚙️ Config'][i]}
            </button>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && (
        cards.length===0
          ? <div style={{ ...card, textAlign:'center', padding:'48px 20px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16, fontWeight:500, marginBottom:8, color:C.text }}>Nenhum dado carregado</div>
              <div style={{ fontSize:13, color:C.textTer, marginBottom:20 }}>Configure o Jira ou carregue dados de exemplo</div>
              <button style={btn(true)} onClick={()=>setTab('config')}>Configurar Jira</button>
              <button style={{ ...btn(false), marginLeft:8 }} onClick={loadSample}>Ver exemplo</button>
            </div>
          : <>
              {/* Metrics */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                  { label:'Total de cards', value:cards.length,    color:'#60A5FA' },
                  { label:'Aguardando GMUD',value:gmudCount,        color:C.teal    },
                  { label:'GMUDs executadas',value:executedCount,   color:'#4ADE80' },
                  { label:'Bloqueados',      value:statusCounts['Blocked']||statusCounts['Cancelado']||0, color:'#F87171' },
                ].map(m=>(
                  <div key={m.label} style={{ ...card, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:C.textTer, marginBottom:4 }}>{m.label}</div>
                    <div style={{ fontSize:26, fontWeight:700, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                <div style={card}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textSec, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:16 }}>Cards por status</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={38}>
                        {pieData.map((e,i)=><Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:11,color:C.textSec}}>{v}</span>} />
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.text }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={card}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textSec, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:16 }}>Cards por responsável</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} layout="vertical" margin={{ left:0, right:16 }}>
                      <XAxis type="number" tick={{ fontSize:11, fill:C.textTer }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:C.textSec }} width={65} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.text }} />
                      <Bar dataKey="value" name="Cards" radius={[0,4,4,0]}>
                        {barData.map((_,i)=>{
                          const colors=['#1AAB8A','#60A5FA','#A78BFA','#FB923C','#F87171','#FBBF24','#2DD4BF','#E879F9']
                          return <Cell key={i} fill={colors[i%colors.length]} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ ...card, gridColumn:'1/-1' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textSec, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:16 }}>GMUDs agendadas por mês</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={monthData} margin={{ top:4 }}>
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:C.textSec }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:C.textTer }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.text }} />
                      <Bar dataKey="value" name="GMUDs" radius={[4,4,0,0]}>
                        {monthData.map((e,i)=><Cell key={i} fill={e.isCurrent ? C.teal : 'rgba(26,171,138,0.35)'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Upcoming GMUDs */}
              <div style={{ fontSize:14, fontWeight:600, marginBottom:12, color:C.text }}>Próximas GMUDs</div>
              {upcomingGmuds.length===0
                ? <div style={{ color:C.textTer, fontSize:13 }}>Nenhuma GMUD agendada. Defina datas na aba Cards/GMUDs.</div>
                : <div style={{ display:'grid', gap:8 }}>
                    {upcomingGmuds.map(c=>{
                      const g=gmud[c.key]||{}, day=getDayTag(g.date)
                      const fmt=new Date(g.date+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
                      return (
                        <div key={c.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, flexWrap:'wrap' }}>
                          <span style={{ fontSize:12, fontWeight:600, color:C.teal, minWidth:100 }}>📅 {fmt}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:C.textSec, minWidth:80 }}>{c.key}</span>
                          <span style={{ fontSize:13, flex:1, color:C.text }}>{c.title.length>60?c.title.slice(0,60)+'…':c.title}</span>
                          <StatusBadge status={c.status} />
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, background:C.surface2, color:C.textSec }}>{g.env||'Produção'}</span>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:600, background:day.bg, color:day.color }}>{day.label}</span>
                        </div>
                      )
                    })}
                  </div>
              }
            </>
      )}

      {/* ── CARDS / GMUDs ── */}
      {tab==='cards' && (
        cards.length===0
          ? <div style={{ ...card, textAlign:'center', padding:'48px 20px', color:C.textTer }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🗂</div>
              <div style={{ marginBottom:16, fontSize:14 }}>Nenhum card carregado</div>
              <button style={btn(true)} onClick={()=>setTab('config')}>Ir para Config</button>
              <button style={{ ...btn(false), marginLeft:8 }} onClick={loadSample}>Carregar exemplo</button>
            </div>
          : <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                <input style={{ ...input, flex:1, minWidth:180, width:'auto' }} placeholder="Buscar por chave, título ou responsável..." value={filterText} onChange={e=>setFilterText(e.target.value)} />
                <select style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, background:C.surface2, color:C.text }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  {[...new Set(cards.map(c=>c.status))].sort().map(s=><option key={s}>{s}</option>)}
                </select>
                <button style={btnSm(false)} onClick={exportCSV}>⬇ CSV</button>
                <button style={{ ...btnSm(true), background:saved?'#0F6E56':C.teal }} onClick={saveAll}>{saved?'✓ Salvo!':'💾 Salvar'}</button>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['Chave','Título','Status','Responsável','Data GMUD','Ambiente','Executada'].map(h=>(
                        <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:600, color:C.textTer, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase', letterSpacing:'.4px', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCards.map(c=>{
                      const g=gmud[c.key]||{}
                      const isExec=!!g.executed
                      const rowBg=isExec ? 'rgba(255,255,255,0.02)' : g.date ? C.tealDim : 'transparent'
                      return (
                        <tr key={c.key} style={{ background:rowBg, opacity:isExec?.55:1, transition:'all .2s' }}>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}`, whiteSpace:'nowrap' }}>
                            {config.jiraUrl
                              ? <a href={`${config.jiraUrl}/browse/${c.key}`} target="_blank" rel="noreferrer" style={{ fontSize:12, fontWeight:700, color:isExec?C.textTer:C.teal, textDecoration:isExec?'line-through':'none' }}>{c.key}</a>
                              : <span style={{ fontSize:12, fontWeight:700, color:isExec?C.textTer:C.teal, textDecoration:isExec?'line-through':'none' }}>{c.key}</span>}
                          </td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}`, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:isExec?C.textTer:C.text, textDecoration:isExec?'line-through':'none' }} title={c.title}>{c.title}</td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}`, whiteSpace:'nowrap' }}><StatusBadge status={c.status} /></td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}`, fontSize:12, color:C.textSec, whiteSpace:'nowrap' }}>{c.assignee}</td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}` }}>
                            <input type="date" value={g.date||''} onChange={e=>updateGmud(c.key,'date',e.target.value)}
                              style={{ fontSize:12, padding:'5px 8px', borderRadius:7, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, width:140 }} disabled={isExec} />
                          </td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}` }}>
                            <select value={g.env||'Produção'} onChange={e=>updateGmud(c.key,'env',e.target.value)}
                              style={{ fontSize:12, padding:'5px 8px', borderRadius:7, border:`1px solid ${C.border}`, background:C.surface2, color:C.text }} disabled={isExec}>
                              <option>Produção</option>
                              <option>Homologação</option>
                              <option>Desenvolvimento</option>
                            </select>
                          </td>
                          <td style={{ padding:'10px 10px', borderBottom:`1px solid ${C.border2}`, textAlign:'center' }}>
                            <button onClick={()=>toggleExecuted(c.key)}
                              title={isExec?'Desfazer execução':'Marcar como executada'}
                              style={{ width:28, height:28, borderRadius:7, border:`1px solid ${isExec?'rgba(74,222,128,0.4)':C.border}`, background:isExec?'rgba(74,222,128,0.15)':'transparent', color:isExec?'#4ADE80':C.textTer, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                              {isExec ? '✓' : '○'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {sortedCards.length===0 && <div style={{ textAlign:'center', padding:'24px', color:C.textTer, fontSize:13 }}>Nenhum card encontrado.</div>}
              </div>
            </div>
      )}

      {/* ── CONFIG ── */}
      {tab==='config' && (
        <>
          <Alert type="info">
            Seus dados ficam salvos no <strong>localStorage</strong> do navegador. O token do Jira é enviado ao servidor apenas para fazer a chamada de API — nunca é armazenado pelo sistema.
          </Alert>

          <div style={card}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16, color:C.text }}>Conexão com o Jira</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              {[
                { id:'jiraUrl', label:'URL do Jira Cloud *',  placeholder:'https://seudominio.atlassian.net', hint: null },
                { id:'project', label:'Chave do projeto *',    placeholder:'Ex: PROJ, SCRUM, DEV',            hint: null },
                { id:'email',   label:'E-mail da conta *',     placeholder:'voce@empresa.com',                hint: null },
                { id:'token',   label:'API Token *',           placeholder:'Token do Atlassian',              hint: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
              ].map(f=>(
                <div key={f.id} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textSec }}>{f.label}</label>
                  <input type={f.id==='token'?'password':'text'} style={input} placeholder={f.placeholder} value={config[f.id]||''} onChange={e=>setConfig(p=>({...p,[f.id]:e.target.value}))} />
                  {f.hint && <a href={f.hint} target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.teal }}>Gerar token ↗</a>}
                </div>
              ))}
              <div style={{ display:'flex', flexDirection:'column', gap:5, gridColumn:'1/-1' }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textSec }}>JQL personalizado (opcional)</label>
                <input style={input} placeholder="sprint in openSprints() AND project = PROJ ORDER BY updated DESC" value={config.jql||''} onChange={e=>setConfig(p=>({...p,jql:e.target.value}))} />
                <span style={{ fontSize:11, color:C.textTer }}>Deixe em branco para buscar todos os cards do projeto</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button style={btn(true)} onClick={connectJira} disabled={loading}>{loading?'⏳ Conectando...':'🔌 Conectar Jira'}</button>
              <button style={btn(false)} onClick={loadSample}>📦 Dados de exemplo</button>
            </div>
            {status && <div style={{ marginTop:12 }}><Alert type={status.type}>{status.msg}</Alert></div>}
          </div>

          <div style={{ ...card, marginTop:16 }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:8, color:C.text }}>Importar JSON da API</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:10 }}>Cole o resultado de <code style={{ background:C.surface2, padding:'1px 5px', borderRadius:4, fontSize:12 }}>/rest/api/3/search/jql?jql=...</code></p>
            <textarea id="json-input" rows={5} style={{ width:'100%', padding:10, border:`1px solid ${C.border}`, borderRadius:8, fontFamily:'monospace', fontSize:12, resize:'vertical', background:C.surface2, color:C.text }} placeholder={'{"issues": [...]} ← cole aqui'} />
            <button style={{ ...btn(true), marginTop:10 }} onClick={importJSON}>⬆ Importar JSON</button>
          </div>
        </>
      )}
    </div>
  )
}
