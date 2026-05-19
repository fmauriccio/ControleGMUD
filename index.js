import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const SAMPLE_ISSUES = [
  { key: 'PROJ-101', fields: { summary: 'Implementar autenticação SSO', status: { name: 'In Progress' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-102', fields: { summary: 'Refatorar módulo de pagamentos', status: { name: 'To Do' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-103', fields: { summary: 'Corrigir bug no relatório mensal', status: { name: 'Blocked' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Bug' } } },
  { key: 'PROJ-104', fields: { summary: 'Migrar banco de dados para v2', status: { name: 'In Progress' }, assignee: { displayName: 'Rafael Costa' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-105', fields: { summary: 'Atualizar dependências do frontend', status: { name: 'Done' }, assignee: { displayName: 'Juliana Rocha' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-106', fields: { summary: 'Implementar cache Redis', status: { name: 'To Do' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-107', fields: { summary: 'Deploy da API v3.0 em produção', status: { name: 'In Progress' }, assignee: { displayName: 'Rafael Costa' }, issuetype: { name: 'Story' } } },
  { key: 'PROJ-108', fields: { summary: 'Criar testes de integração E2E', status: { name: 'To Do' }, assignee: { displayName: 'Juliana Rocha' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-109', fields: { summary: 'Rollout feature flags de segurança', status: { name: 'Done' }, assignee: { displayName: 'Ana Silva' }, issuetype: { name: 'Task' } } },
  { key: 'PROJ-110', fields: { summary: 'Configurar pipeline CI/CD', status: { name: 'In Progress' }, assignee: { displayName: 'Carlos Mendes' }, issuetype: { name: 'Story' } } },
]

const futureDate = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const SAMPLE_GMUD = {
  'PROJ-104': { date: futureDate(3), env: 'Produção' },
  'PROJ-107': { date: futureDate(8), env: 'Produção' },
  'PROJ-110': { date: futureDate(15), env: 'Homologação' },
  'PROJ-101': { date: futureDate(22), env: 'Produção' },
  'PROJ-106': { date: futureDate(30), env: 'Homologação' },
}

const STATUS_COLORS = {
  'To Do': '#85B7EB',
  'In Progress': '#FAC775',
  'Done': '#C0DD97',
  'Blocked': '#F09595',
  'In Review': '#CECBF6',
  'Testing': '#9FE1CB',
}

const STATUS_BADGE = {
  'To Do': { label: 'A fazer', bg: '#E6F1FB', color: '#185FA5' },
  'In Progress': { label: 'Em progresso', bg: '#FAEEDA', color: '#854F0B' },
  'Done': { label: 'Concluído', bg: '#EAF3DE', color: '#3B6D11' },
  'Blocked': { label: 'Bloqueado', bg: '#FCEBEB', color: '#A32D2D' },
  'In Review': { label: 'Em revisão', bg: '#EEEDFE', color: '#534AB7' },
  'Testing': { label: 'Testando', bg: '#E1F5EE', color: '#0F6E56' },
}

const S = {
  wrap: { maxWidth: 960, margin: '0 auto', padding: '24px 20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, background: '#1AAB8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 },
  logoText: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' },
  logoSub: { fontSize: 12, color: '#888', marginTop: 1 },
  tabs: { display: 'flex', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 4, gap: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  tab: (active) => ({ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400, background: active ? '#1AAB8A' : 'transparent', color: active ? '#fff' : '#666', transition: 'all 0.15s' }),
  card: { background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 20 },
  metric: { background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  metricLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  chartFull: { gridColumn: '1 / -1' },
  chartTitle: { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 },
  btn: { padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#333', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' },
  btnPrimary: { background: '#1AAB8A', color: '#fff', border: '1px solid #1AAB8A' },
  btnSm: { padding: '6px 12px', fontSize: 12 },
  toolbar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  input: { padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', background: '#fff', color: '#333' },
  select: { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, background: '#fff', color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#999', borderBottom: '1px solid rgba(0,0,0,0.07)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', verticalAlign: 'middle' },
  badge: (status) => {
    const b = STATUS_BADGE[status] || { label: status, bg: '#f0f0f0', color: '#666' }
    return { display: 'inline-block', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color }
  },
  alert: (type) => {
    const m = { info: ['#E6F1FB','#185FA5','#B5D4F4'], warn: ['#FAEEDA','#854F0B','#FAC775'], ok: ['#EAF3DE','#3B6D11','#C0DD97'], err: ['#FCEBEB','#A32D2D','#F7C1C1'] }
    const [bg, color, border] = m[type] || m.info
    return { padding: '10px 14px', borderRadius: 8, fontSize: 13, background: bg, color, border: `1px solid ${border}`, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }
  },
  gmudRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, flexWrap: 'wrap' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#666' },
  hint: { fontSize: 11, color: '#aaa' },
  configGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  empty: { textAlign: 'center', padding: '48px 20px', color: '#bbb' },
}

function Badge({ status }) {
  const b = STATUS_BADGE[status] || { label: status, bg: '#f0f0f0', color: '#666' }
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
}

function Alert({ type = 'info', children }) {
  const icons = { info: 'ℹ', warn: '⚠', ok: '✓', err: '✕' }
  return <div style={S.alert(type)}><span>{icons[type]}</span><div>{children}</div></div>
}

function MetricCard({ label, value, color }) {
  return (
    <div style={S.metric}>
      <div style={S.metricLabel}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#333' }}>{value}</div>
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState('dashboard')
  const [cards, setCards] = useState([])
  const [gmud, setGmud] = useState({})
  const [config, setConfig] = useState({ jiraUrl: '', email: '', token: '', project: '', jql: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const c = localStorage.getItem('gmud-config')
      if (c) setConfig(JSON.parse(c))
      const g = localStorage.getItem('gmud-gmud')
      if (g) setGmud(JSON.parse(g))
      const k = localStorage.getItem('gmud-cards')
      if (k) setCards(JSON.parse(k))
    } catch {}
  }, [])

  const saveToStorage = useCallback((newCards, newGmud, newConfig) => {
    try {
      if (newCards !== undefined) localStorage.setItem('gmud-cards', JSON.stringify(newCards))
      if (newGmud !== undefined) localStorage.setItem('gmud-gmud', JSON.stringify(newGmud))
      if (newConfig !== undefined) localStorage.setItem('gmud-config', JSON.stringify(newConfig))
    } catch {}
  }, [])

  const processIssues = useCallback((issues, existingGmud) => {
    const g = existingGmud || gmud
    const processed = issues.map(i => ({
      key: i.key,
      title: i.fields?.summary || '',
      status: i.fields?.status?.name || 'To Do',
      assignee: i.fields?.assignee?.displayName || '—',
      type: i.fields?.issuetype?.name || 'Task',
      gmudDate: g[i.key]?.date || '',
      gmudEnv: g[i.key]?.env || 'Produção',
    }))
    setCards(processed)
    saveToStorage(processed, undefined, undefined)
    return processed
  }, [gmud, saveToStorage])

  const connectJira = async () => {
    if (!config.jiraUrl || !config.email || !config.token || !config.project) {
      setStatus({ type: 'err', msg: 'Preencha todos os campos obrigatórios.' })
      return
    }
    setLoading(true)
    setStatus(null)
    const jql = config.jql || `project = ${config.project} ORDER BY updated DESC`
    try {
      const res = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jiraUrl: config.jiraUrl, email: config.email, token: config.token, jql, maxResults: 100 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      processIssues(data.issues || [])
      saveToStorage(undefined, undefined, config)
      setStatus({ type: 'ok', msg: `${data.issues?.length || 0} cards carregados com sucesso!` })
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  const loadSample = () => {
    const g = SAMPLE_GMUD
    setGmud(g)
    saveToStorage(undefined, g, undefined)
    processIssues(SAMPLE_ISSUES, g)
    setStatus({ type: 'ok', msg: 'Dados de exemplo carregados!' })
    setTab('dashboard')
  }

  const importJSON = () => {
    const raw = document.getElementById('json-input')?.value?.trim()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const issues = parsed.issues || parsed
      if (!Array.isArray(issues)) throw new Error('Formato inválido — precisa ser um array de issues')
      processIssues(issues)
      setStatus({ type: 'ok', msg: `${issues.length} cards importados!` })
    } catch (e) {
      setStatus({ type: 'err', msg: 'JSON inválido: ' + e.message })
    }
  }

  const updateGmud = (key, field, value) => {
    const newGmud = { ...gmud, [key]: { ...(gmud[key] || {}), [field]: value } }
    setGmud(newGmud)
    saveToStorage(undefined, newGmud, undefined)
    setCards(prev => prev.map(c => c.key === key ? { ...c, gmudDate: newGmud[key]?.date || c.gmudDate, gmudEnv: newGmud[key]?.env || c.gmudEnv } : c))
  }

  const saveAll = () => {
    saveToStorage(cards, gmud, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportCSV = () => {
    const rows = [['Chave', 'Título', 'Status', 'Responsável', 'Data GMUD', 'Ambiente']]
    cards.filter(c => gmud[c.key]?.date).forEach(c => {
      rows.push([c.key, c.title, c.status, c.assignee, gmud[c.key]?.date || '', gmud[c.key]?.env || ''])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `gmud_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredCards = cards.filter(c => {
    const q = filterText.toLowerCase()
    const matchText = !q || c.key.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.assignee.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchText && matchStatus
  })

  const statusCounts = cards.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {})
  const assigneeCounts = cards.reduce((acc, c) => { if (c.assignee !== '—') acc[c.assignee] = (acc[c.assignee] || 0) + 1; return acc }, {})
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: STATUS_BADGE[name]?.label || name, value, color: STATUS_COLORS[name] || '#ccc' }))
  const assigneeData = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name: name.split(' ')[0], value }))

  const now = new Date()
  const monthData = (() => {
    const m = {}
    for (let i = -1; i <= 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      m[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
    }
    cards.filter(c => gmud[c.key]?.date).forEach(c => {
      const mo = gmud[c.key].date.substring(0, 7)
      if (mo in m) m[mo]++
    })
    return Object.entries(m).map(([key, value]) => {
      const [y, mo] = key.split('-')
      return { name: new Date(+y, +mo - 1, 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }), value, isCurrent: key === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` }
    })
  })()

  const upcomingGmuds = cards
    .filter(c => gmud[c.key]?.date)
    .sort((a, b) => gmud[a.key].date.localeCompare(gmud[b.key].date))
    .slice(0, 8)

  const gmudCount = cards.filter(c => gmud[c.key]?.date && new Date(gmud[c.key].date + 'T00:00:00') >= now).length

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.ceil((d - now) / 864e5)
    if (diff < 0) return { label: `${Math.abs(diff)}d atrás`, color: '#A32D2D', bg: '#FCEBEB' }
    if (diff === 0) return { label: 'Hoje!', color: '#854F0B', bg: '#FAEEDA' }
    if (diff === 1) return { label: 'Amanhã', color: '#854F0B', bg: '#FAEEDA' }
    if (diff <= 7) return { label: `em ${diff}d`, color: '#854F0B', bg: '#FAEEDA' }
    return { label: `em ${diff}d`, color: '#3B6D11', bg: '#EAF3DE' }
  }

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>G</div>
          <div>
            <div style={S.logoText}>GMUD Manager</div>
            <div style={S.logoSub}>Integração Jira para Scrum Masters</div>
          </div>
        </div>
        <div style={S.tabs}>
          {['dashboard', 'cards', 'config'].map(t => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
              {t === 'dashboard' ? '📊 Dashboard' : t === 'cards' ? '🗂 Cards / GMUDs' : '⚙️ Config'}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div>
          {cards.length === 0 ? (
            <div style={{ ...S.card, ...S.empty }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Nenhum dado carregado</div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>Configure sua conexão com o Jira ou carregue dados de exemplo</div>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setTab('config')}>Configurar Jira</button>
              <button style={{ ...S.btn, marginLeft: 8 }} onClick={loadSample}>Ver exemplo</button>
            </div>
          ) : (
            <>
              <div style={S.metricGrid}>
                <MetricCard label="Total de cards" value={cards.length} color="#185FA5" />
                <MetricCard label="Em progresso" value={statusCounts['In Progress'] || 0} color="#BA7517" />
                <MetricCard label="Bloqueados" value={statusCounts['Blocked'] || 0} color="#A32D2D" />
                <MetricCard label="GMUDs agendadas" value={gmudCount} color="#1AAB8A" />
              </div>

              <div style={S.chartGrid}>
                <div style={S.card}>
                  <div style={S.chartTitle}>Cards por status</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Legend iconType="square" iconSize={10} formatter={(v) => <span style={{ fontSize: 11, color: '#666' }}>{v}</span>} />
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={S.card}>
                  <div style={S.chartTitle}>Cards por responsável</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={assigneeData} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#999' }} width={70} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#9FE1CB" radius={[0, 4, 4, 0]} name="Cards" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ ...S.card, ...S.chartFull }}>
                  <div style={S.chartTitle}>GMUDs agendadas por mês</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={monthData} margin={{ top: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#999' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#999' }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="GMUDs" radius={[4, 4, 0, 0]}>
                        {monthData.map((entry, i) => <Cell key={i} fill={entry.isCurrent ? '#1AAB8A' : '#9FE1CB'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Próximas GMUDs</div>
              {upcomingGmuds.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: 13 }}>Nenhuma GMUD agendada ainda. Acesse a aba Cards/GMUDs para definir as datas.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {upcomingGmuds.map(c => {
                    const g = gmud[c.key] || {}
                    const day = getDayLabel(g.date)
                    const fmtDate = new Date(g.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                    return (
                      <div key={c.key} style={S.gmudRow}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1AAB8A', minWidth: 100 }}>📅 {fmtDate}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#888', minWidth: 80 }}>{c.key}</span>
                        <span style={{ fontSize: 13, flex: 1 }}>{c.title.length > 60 ? c.title.slice(0, 60) + '…' : c.title}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#f0f0f0', color: '#666' }}>{g.env || 'Produção'}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 600, background: day.bg, color: day.color }}>{day.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CARDS */}
      {tab === 'cards' && (
        <div>
          {cards.length === 0 ? (
            <div style={{ ...S.card, ...S.empty }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>Nenhum card carregado</div>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setTab('config')}>Ir para Config</button>
              <button style={{ ...S.btn, marginLeft: 8 }} onClick={loadSample}>Carregar exemplo</button>
            </div>
          ) : (
            <div style={S.card}>
              <div style={S.toolbar}>
                <input
                  style={{ ...S.input, flex: 1, minWidth: 180 }}
                  placeholder="Buscar por chave, título ou responsável..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                />
                <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="To Do">A fazer</option>
                  <option value="In Progress">Em progresso</option>
                  <option value="Done">Concluído</option>
                  <option value="Blocked">Bloqueado</option>
                  <option value="In Review">Em revisão</option>
                </select>
                <button style={{ ...S.btn, ...S.btnSm }} onClick={exportCSV}>⬇ Exportar CSV</button>
                <button
                  style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm, background: saved ? '#0F6E56' : '#1AAB8A' }}
                  onClick={saveAll}
                >
                  {saved ? '✓ Salvo!' : '💾 Salvar'}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, width: 90 }}>Chave</th>
                      <th style={S.th}>Título</th>
                      <th style={{ ...S.th, width: 120 }}>Status</th>
                      <th style={{ ...S.th, width: 130 }}>Responsável</th>
                      <th style={{ ...S.th, width: 150 }}>Data GMUD</th>
                      <th style={{ ...S.th, width: 130 }}>Ambiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map(c => (
                      <tr key={c.key} style={{ background: gmud[c.key]?.date ? 'rgba(26,171,138,0.04)' : 'transparent' }}>
                        <td style={{ ...S.td, fontWeight: 600, color: '#1AAB8A', fontSize: 12 }}>
                          {config.jiraUrl
                            ? <a href={`${config.jiraUrl}/browse/${c.key}`} target="_blank" rel="noreferrer">{c.key}</a>
                            : c.key}
                        </td>
                        <td style={{ ...S.td, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.title}>{c.title}</td>
                        <td style={S.td}><Badge status={c.status} /></td>
                        <td style={{ ...S.td, fontSize: 12, color: '#888' }}>{c.assignee}</td>
                        <td style={S.td}>
                          <input
                            type="date"
                            value={gmud[c.key]?.date || ''}
                            onChange={e => updateGmud(c.key, 'date', e.target.value)}
                            style={{ ...S.input, padding: '5px 8px', fontSize: 12, width: 140 }}
                          />
                        </td>
                        <td style={S.td}>
                          <select
                            value={gmud[c.key]?.env || 'Produção'}
                            onChange={e => updateGmud(c.key, 'env', e.target.value)}
                            style={{ ...S.select, fontSize: 12, padding: '5px 8px' }}
                          >
                            <option>Produção</option>
                            <option>Homologação</option>
                            <option>Desenvolvimento</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCards.length === 0 && (
                  <div style={{ ...S.empty, padding: '24px' }}>Nenhum card encontrado com esses filtros.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIG */}
      {tab === 'config' && (
        <div>
          <Alert type="info">
            Seus dados ficam salvos no <strong>localStorage</strong> do navegador. O token do Jira é enviado ao servidor apenas para fazer a chamada de API — nunca é armazenado pelo sistema.
          </Alert>

          <div style={S.card}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Conexão com o Jira</div>
            <div style={S.configGrid}>
              <div style={S.fieldGroup}>
                <label style={S.label}>URL do Jira Cloud *</label>
                <input style={S.input} placeholder="https://seudominio.atlassian.net" value={config.jiraUrl} onChange={e => setConfig(p => ({ ...p, jiraUrl: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Chave do projeto *</label>
                <input style={S.input} placeholder="Ex: PROJ, SCRUM, DEV" value={config.project} onChange={e => setConfig(p => ({ ...p, project: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>E-mail da conta *</label>
                <input type="email" style={S.input} placeholder="voce@empresa.com" value={config.email} onChange={e => setConfig(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>API Token *</label>
                <input type="password" style={S.input} placeholder="Token de API do Atlassian" value={config.token} onChange={e => setConfig(p => ({ ...p, token: e.target.value }))} />
                <span style={S.hint}><a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">Gerar token aqui ↗</a></span>
              </div>
              <div style={{ ...S.fieldGroup, gridColumn: '1 / -1' }}>
                <label style={S.label}>JQL personalizado (opcional)</label>
                <input style={S.input} placeholder="sprint in openSprints() AND project = PROJ ORDER BY updated DESC" value={config.jql} onChange={e => setConfig(p => ({ ...p, jql: e.target.value }))} />
                <span style={S.hint}>Deixe em branco para buscar todos os cards do projeto</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={connectJira} disabled={loading}>
                {loading ? '⏳ Conectando...' : '🔌 Conectar Jira'}
              </button>
              <button style={S.btn} onClick={loadSample}>📦 Dados de exemplo</button>
            </div>

            {status && <div style={{ marginTop: 12 }}><Alert type={status.type}>{status.msg}</Alert></div>}
          </div>

          <div style={{ ...S.card, marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Importar JSON da API</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
              Cole o resultado de <code style={{ background: '#f0f0f0', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>/rest/api/3/search?jql=...</code>
            </p>
            <textarea
              id="json-input"
              rows={5}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              placeholder={'{"issues": [...]} ← cole aqui o retorno da API'}
            />
            <button style={{ ...S.btn, ...S.btnPrimary, marginTop: 10 }} onClick={importJSON}>⬆ Importar JSON</button>
          </div>
        </div>
      )}
    </div>
  )
}
