import { useState, useEffect, useCallback } from 'react'

const COLS = [
  { id:'bom',      label:'😊 O que foi bom',       color:'#34D399', bg:'rgba(52,211,153,.1)'  },
  { id:'faltou',   label:'😟 O que faltou',         color:'#F87171', bg:'rgba(248,113,113,.1)' },
  { id:'melhorar', label:'💡 O que pode melhorar',  color:'#FCD34D', bg:'rgba(252,211,77,.1)'  },
  { id:'acao',     label:'⚡ Ação',                  color:'#60A5FA', bg:'rgba(96,165,250,.1)'  },
]

const T = {
  bg:'#0A0F1E',card:'#111827',card2:'#1E293B',
  border:'rgba(148,163,184,.1)',text:'#E2E8F0',
  sec:'#94A3B8',ter:'#475569',teal:'#1AAB8A',green:'#10B981'
}

function printRetro(session) {
  const rows = COLS.map(col => {
    const items = (session.retroItems?.[col.id] || [])
    if (!items.length) return ''
    return `<div style="margin-bottom:24px">
      <h2 style="color:${col.color};font-size:15px;margin-bottom:10px;border-bottom:2px solid ${col.color};padding-bottom:6px">${col.label}</h2>
      <ul style="padding-left:20px">${items.map(i=>`<li style="margin:6px 0;font-size:14px">${i.text}</li>`).join('')}</ul>
    </div>`
  }).join('')
  const html = `<html><head><title>Retrospectiva</title><style>
    body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
    h1{color:#1AAB8A;margin-bottom:4px} .sub{color:#888;font-size:13px;margin-bottom:30px}
    @media print{body{padding:20px}}
  </style></head><body>
    <h1>📋 Retrospectiva</h1>
    <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} · GMUD Manager</div>
    ${rows}
  </body></html>`
  const w = window.open('','_blank')
  w.document.write(html); w.document.close()
  setTimeout(()=>w.print(), 400)
}

export default function Retro() {
  const [sid,setSid]       = useState('')
  const [isHost,setIsHost] = useState(false)
  const [session,setSession] = useState(null)
  const [inputs,setInputs] = useState({bom:'',faltou:'',melhorar:'',acao:''})

  useEffect(()=>{
    if (typeof window==='undefined') return
    const p = new URLSearchParams(window.location.search)
    const s = p.get('session')
    const h = p.get('host')
    if (s) { setSid(s); setIsHost(!!h) }
  },[])

  const api = useCallback(async (body) => {
    const r = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    return r.json()
  },[])

  useEffect(()=>{
    if (!sid) return
    const fetch_ = async () => {
      const s = await api({action:'get',sessionId:sid})
      if (s) setSession(s)
    }
    fetch_()
    const t = setInterval(fetch_, 2500)
    return ()=>clearInterval(t)
  },[sid,api])

  const addItem = async (col) => {
    const text = inputs[col]?.trim()
    if (!text) return
    const s = await api({action:'addRetro',sessionId:sid,column:col,text})
    setSession(s)
    setInputs(p=>({...p,[col]:''}))
  }

  const delItem = async (col,itemId) => {
    if (!isHost) return
    const s = await api({action:'delRetro',sessionId:sid,column:col,itemId})
    setSession(s)
  }

  const inp = {padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13,outline:'none',flex:1}

  if (!sid) return (
    <div style={{fontFamily:'-apple-system,sans-serif',background:T.bg,color:T.text,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:40}}>
        <div style={{fontSize:48,marginBottom:12}}>🔄</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Retrospectiva</div>
        <div style={{color:T.sec,fontSize:14}}>Acesse pelo link compartilhado pelo Scrum Master.</div>
      </div>
    </div>
  )

  if (!session) return (
    <div style={{fontFamily:'-apple-system,sans-serif',background:T.bg,color:T.text,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:T.sec}}>Carregando retrospectiva...</div>
    </div>
  )

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',background:T.bg,color:T.text,minHeight:'100vh',padding:'24px 20px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,margin:0}}>🔄 Retrospectiva</h1>
            <p style={{fontSize:13,color:T.ter,margin:'4px 0 0'}}>
              {Object.values(session.retroItems||{}).flat().length} itens registrados
            </p>
          </div>
          {isHost && (
            <button onClick={()=>printRetro(session)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${T.teal},${T.green})`,color:'#fff',fontWeight:600,fontSize:14,cursor:'pointer'}}>
              🖨 Exportar PDF
            </button>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
          {COLS.map(col=>{
            const items = session.retroItems?.[col.id] || []
            return (
              <div key={col.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                <div style={{padding:'12px 16px',background:col.bg,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:col.color}}>{col.label}</div>
                  <div style={{fontSize:11,color:T.ter,marginTop:2}}>{items.length} ite{items.length!==1?'ns':'m'}</div>
                </div>
                <div style={{flex:1,padding:'12px',display:'flex',flexDirection:'column',gap:6,minHeight:120}}>
                  {items.map(item=>(
                    <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:6,padding:'8px 10px',background:T.card2,borderRadius:7,fontSize:13,lineHeight:1.4}}>
                      <span style={{flex:1,color:T.text}}>{item.text}</span>
                      {isHost && (
                        <button onClick={()=>delItem(col.id,item.id)} style={{background:'transparent',border:'none',color:T.ter,cursor:'pointer',fontSize:14,padding:'0 2px',flexShrink:0,lineHeight:1}}>✕</button>
                      )}
                    </div>
                  ))}
                  {items.length===0 && (
                    <div style={{color:T.ter,fontSize:12,textAlign:'center',padding:'20px 0'}}>Nenhum item ainda</div>
                  )}
                </div>
                <div style={{padding:'10px 12px',borderTop:`1px solid ${T.border}`,display:'flex',gap:6}}>
                  <input value={inputs[col.id]} onChange={e=>setInputs(p=>({...p,[col.id]:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&addItem(col.id)}
                    placeholder="Adicionar..." style={inp}/>
                  <button onClick={()=>addItem(col.id)} style={{padding:'8px 12px',borderRadius:8,border:'none',background:col.bg,color:col.color,fontWeight:700,cursor:'pointer',fontSize:18,lineHeight:1}}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}