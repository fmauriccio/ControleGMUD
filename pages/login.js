import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const T = {
  bg:'#0A0F1E', card:'#111827', card2:'#1E293B',
  border:'rgba(148,163,184,.12)', text:'#E2E8F0',
  sec:'#94A3B8', ter:'#475569', teal:'#1AAB8A', green:'#10B981'
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message) }
    else router.replace('/')
    setLoading(false)
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:8, border:`1px solid ${T.border}`,
    background:T.card2, color:T.text, fontSize:14, outline:'none', marginTop:5 }

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', background:T.bg,
      color:T.text, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${T.teal},${T.green})`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700,
            color:'#fff', margin:'0 auto 16px' }}>G</div>
          <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>GMUD Manager</h1>
          <p style={{ fontSize:13, color:T.ter }}>Entre na sua conta</p>
        </div>

        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:'28px 28px' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>E-mail</label>
              <input type="email" style={inp} placeholder="voce@empresa.com"
                value={email} onChange={e=>setEmail(e.target.value)} autoFocus/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>Senha</label>
              <input type="password" style={inp} placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)}/>
            </div>
            {error && (
              <div style={{ padding:'9px 12px', borderRadius:8, background:'rgba(239,68,68,.1)',
                color:'#F87171', border:'1px solid rgba(239,68,68,.25)', fontSize:13, marginBottom:16 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none',
              background:`linear-gradient(135deg,${T.teal},${T.green})`, color:'#fff', fontSize:14, fontWeight:600,
              cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1 }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:T.ter }}>
            Não tem conta?{' '}
            <a href="/register" style={{ color:T.teal, fontWeight:600, textDecoration:'none' }}>Criar conta</a>
          </p>
        </div>
      </div>
    </div>
  )
}
