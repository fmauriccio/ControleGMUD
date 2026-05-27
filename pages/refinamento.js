import { useState, useEffect, useCallback } from 'react'

const FIBONACCI = ['0','1','2','3','5','8','13','21','34','55','89','?','☕']
const TSHIRT    = ['XS','S','M','L','XL','XXL','?','☕']
const FIBO_NUM  = {'0':0,'1':1,'2':2,'3':3,'5':5,'8':8,'13':13,'21':21,'34':34,'55':55,'89':89}
const TSHIRT_NUM= {'XS':1,'S':2,'M':3,'L':5,'XL':8,'XXL':13}

const T = {
  bg:'#0A0F1E',card:'#111827',card2:'#1E293B',
  border:'rgba(148,163,184,.1)',text:'#E2E8F0',
  sec:'#94A3B8',ter:'#475569',teal:'#1AAB8A',green:'#10B981'
}

function calcMedia(votes, type) {
  const vals = Object.values(votes)
  if (!vals.length) return '-'
  if (type === 'fibonacci') {
    const nums = vals.filter(v => FIBO_NUM[v] !== undefined).map(v => FIBO_NUM[v])
    if (!nums.length) return '-'
    const avg = nums.reduce((a,b)=>a+b,0)/nums.length
    const closest = Object.keys(FIBO_NUM).reduce((p,c) => Math.abs(FIBO_NUM[c]-avg) < Math.abs(FIBO_NUM[p]-avg) ? c : p)
    return `${closest} (média ${avg.toFixed(1)})`
  }
  if (type === 'tshirt') {
    const nums = vals.filter(v => TSHIRT_NUM[v]).map(v => TSHIRT_NUM[v])
    if (!nums.length) return '-'
    const avg = nums.reduce((a,b)=>a+b,0)/nums.length
    const closest = Object.keys(TSHIRT_NUM).reduce((p,c) => Math.abs(TSHIRT_NUM[c]-avg) < Math.abs(TSHIRT_NUM[p]-avg) ? c : p)
    return `${closest} (média ${avg.toFixed(1)})`
  }
  const nums = vals.filter(v => !isNaN(parseFloat(v))).map(parseFloat)
  if (!nums.length) return '-'
  return (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1)
}

function st(add) {
  return {
    fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
    background:T.bg, color:T.text, minHeight:'100vh', ...add
  }
}

export default function Refinamento() {
  const [sid,setSid]     = useState('')
  const [isHost,setIsHost] = useState(false)
  const [name,setName]   = useState('')
  const [voted,setVoted] = useState('')
  const [session,setSession] = useState(null)
  const [loading,setLoading] = useState(false)
  const [err,setErr]     = useState('')
  const [customInput,setCustomInput] = useState('')
  const [newTitle,setNewTitle] = useState('')

  useEffect(()=>{
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const s = p.get('session')
    const h = p.get('host')
    if (s) { setSid(s); setIsHost(!!h) }
  },[])

  const api = useCallback(async (body) => {
    const r = await fetch('/api/session', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    return r.json()
  },[])

  // Poll session
  useEffect(()=>{
    if (!sid) return
    const fetch_ = async () => {
      const s = await api({ action:'get', sessionId:sid })
      if (s) setSession(s)
    }
    fetch_()
    const t = setInterval(fetch_, 2500)
    return () => clearInterval(t)
  },[sid, api])

  const vote = async (v) => {
    if (!name.trim()) { setErr('Digite seu nome antes de votar'); return }
    setVoted(v); setErr('')
    const s = await api({ action:'vote', sessionId:sid, name:name.trim(), vote:v })
    setSession(s)
  }

  const reveal  = async () => { const s = await api({action:'reveal',sessionId:sid}); setSession(s) }
  const reset   = async () => { setVoted(''); const s = await api({action:'reset',sessionId:sid}); setSession(s) }
  const newRound= async () => { setVoted(''); const s = await api({action:'newRound',sessionId:sid,title:newTitle||session?.title}); setSession(s); setNewTitle('') }

  const cards = session?.type==='tshirt' ? TSHIRT : session?.type==='custom' ? (session.customValues||[]) : FIBONACCI
  const voteCount = Object.keys(session?.votes||{}).length
  const media = session?.revealed ? calcMedia(session.votes, session?.type) : null

  const inp = {padding:'10px 14px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:14,outline:'none',width:'100%'}
  const btn = (primary) => ({padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14,background:primary?`linear-gradient(135deg,${T.teal},${T.green})`:'rgba(148,163,184,.15)',color:primary?'#fff':T.text,transition:'all .15s'})

  if (!sid) return (
    <div style={st({display:'flex',alignItems:'center',justifyContent:'center'})}>
      <div style={{textAlign:'center',padding:40}}>
        <div style={{fontSize:48,marginBottom:12}}>🃏</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Refinamento</div>
        <div style={{color:T.sec,fontSize:14}}>Acesse pelo link compartilhado pelo Scrum Master.</div>
      </div>
    </div>
  )

  if (!session) return (
    <div style={st({display:'flex',alignItems:'center',justifyContent:'center'})}>
      <div style={{color:T.sec}}>Carregando sessão...</div>
    </div>
  )

  return (
    <div style={st({padding:'24px 20px',maxWidth:800,margin:'0 auto'})}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:11,color:T.ter,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>
            {session.type==='fibonacci'?'Fibonacci':session.type==='tshirt'?'T-Shirt':'Custom'} · {voteCount} voto{voteCount!==1?'s':''}
          </div>
          <h1 style={{fontSize:22,fontWeight:700,margin:0}}>{session.title}</h1>
        </div>
        {isHost && (
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={reveal} style={{...btn(true),padding:'8px 16px',fontSize:13}}>
              {session.revealed?'🙈 Ocultar':'👁 Revelar votos'}
            </button>
            <button onClick={reset} style={{...btn(false),padding:'8px 16px',fontSize:13}}>🔄 Resetar</button>
          </div>
        )}
      </div>

      {/* Resultado */}
      {session.revealed && (
        <div style={{background:T.card,border:`1px solid rgba(26,171,138,.3)`,borderRadius:12,padding:'20px 24px',marginBottom:24,textAlign:'center'}}>
          <div style={{fontSize:12,color:T.ter,marginBottom:6,textTransform:'uppercase',letterSpacing:'.5px'}}>Resultado</div>
          <div style={{fontSize:40,fontWeight:700,color:T.teal,marginBottom:12}}>{media}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center'}}>
            {Object.entries(session.votes).map(([n,v])=>(
              <div key={n} style={{background:T.card2,borderRadius:8,padding:'8px 14px',textAlign:'center',minWidth:70}}>
                <div style={{fontSize:20,fontWeight:700,color:T.teal}}>{v}</div>
                <div style={{fontSize:11,color:T.sec,marginTop:2}}>{n}</div>
              </div>
            ))}
          </div>
          {isHost && (
            <div style={{marginTop:16,display:'flex',gap:8,justifyContent:'center',alignItems:'center',flexWrap:'wrap'}}>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Título da próxima rodada..." style={{...inp,width:260,padding:'8px 12px',fontSize:13}}/>
              <button onClick={newRound} style={{...btn(true),padding:'8px 16px',fontSize:13}}>▶ Nova rodada</button>
            </div>
          )}
        </div>
      )}

      {/* Status votos */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px',marginBottom:24}}>
        <div style={{fontSize:11,color:T.ter,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:12}}>Participantes ({voteCount})</div>
        {voteCount===0
          ? <div style={{color:T.ter,fontSize:13}}>Aguardando votos...</div>
          : <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {Object.entries(session.votes).map(([n,v])=>(
                <div key={n} style={{display:'flex',alignItems:'center',gap:8,background:T.card2,borderRadius:8,padding:'6px 12px'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:T.teal,flexShrink:0}}/>
                  <span style={{fontSize:13}}>{n}</span>
                  {session.revealed
                    ? <span style={{fontSize:14,fontWeight:700,color:T.teal}}>{v}</span>
                    : <span style={{fontSize:11,color:T.ter}}>✓ votou</span>}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Área de votação */}
      {!isHost && (
        <>
          {!name && (
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:'20px',marginBottom:20}}>
              <div style={{fontSize:13,color:T.sec,marginBottom:8}}>Seu nome</div>
              <div style={{display:'flex',gap:8}}>
                <input style={inp} placeholder="Digite seu nome..." autoFocus
                  onKeyDown={e=>e.key==='Enter'&&e.target.value.trim()&&setName(e.target.value.trim())}
                  onBlur={e=>e.target.value.trim()&&setName(e.target.value.trim())}/>
              </div>
              {err && <div style={{color:'#F87171',fontSize:12,marginTop:6}}>{err}</div>}
            </div>
          )}
          {name && !session.revealed && (
            <div>
              <div style={{fontSize:13,color:T.sec,marginBottom:12}}>
                Olá <strong style={{color:T.text}}>{name}</strong>! Selecione seu voto:
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                {cards.map(c=>(
                  <button key={c} onClick={()=>vote(c)} style={{
                    width:64,height:90,borderRadius:10,border:`2px solid ${voted===c?T.teal:T.border}`,
                    background:voted===c?'rgba(26,171,138,.15)':T.card,color:voted===c?T.teal:T.text,
                    fontSize:c.length>2?16:22,fontWeight:700,cursor:'pointer',transition:'all .15s',
                    display:'flex',alignItems:'center',justifyContent:'center'
                  }}>{c}</button>
                ))}
              </div>
              {voted && <div style={{marginTop:12,fontSize:13,color:'#34D399'}}>✓ Você votou: <strong>{voted}</strong></div>}
            </div>
          )}
          {session.revealed && (
            <div style={{textAlign:'center',padding:'20px',color:T.sec,fontSize:14}}>
              Aguardando a próxima rodada...
            </div>
          )}
        </>
      )}
    </div>
  )
}