import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const T = {
  bg:'#0A0F1E', card:'#111827', card2:'#1E293B',
  border:'rgba(148,163,184,.12)', text:'#E2E8F0',
  sec:'#94A3B8', ter:'#475569', teal:'#1AAB8A', green:'#10B981'
}

function validatePassword(pwd) {
  if (pwd.length < 8)              return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(pwd))          return 'Precisa de pelo menos 1 letra maiúscula'
  if (!/[0-9]/.test(pwd))          return 'Precisa de pelo menos 1 número'
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd)) return 'Precisa de pelo menos 1 caractere especial (!@#$...)'
  return null
}

function PasswordStrength({ password }) {
  const checks = [
    { label:'8+ caracteres', ok: password.length >= 8 },
    { label:'Maiúscula',      ok: /[A-Z]/.test(password) },
    { label:'Número',         ok: /[0-9]/.test(password) },
    { label:'Especial',       ok: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['#EF4444','#F97316','#FCD34D','#34D399','#10B981']
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2,
            background: i < score ? colors[score] : 'rgba(148,163,184,.2)', transition:'all .3s' }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize:11, color: c.ok ? '#34D399' : '#475569' }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim())            { setError('Informe seu nome.'); return }
    if (!email)                  { setError('Informe o e-mail.'); return }
    const pwdErr = validatePassword(password)
    if (pwdErr)                  { setError(pwdErr); return }
    if (password !== confirm)    { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    if (err) {
      if (err.message.includes('already registered')) setError('Este e-mail já está cadastrado.')
      else setError(err.message)
      setLoading(false)
      return
    }
    // Auto sign in after register
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
    if (!loginErr) { router.replace('/'); return }
    setSuccess(true)
    setLoading(false)
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:8, border:`1px solid rgba(148,163,184,.12)`,
    background:'#1E293B', color:'#E2E8F0', fontSize:14, outline:'none', marginTop:5 }

  if (success) return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:T.bg, color:T.text,
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:20, marginBottom:8 }}>Conta criada!</h2>
        <p style={{ color:T.ter, fontSize:14, marginBottom:20 }}>
          Confirme seu e-mail e faça login para continuar.
        </p>
        <a href="/login" style={{ display:'inline-block', padding:'10px 24px', borderRadius:8,
          background:`linear-gradient(135deg,${T.teal},${T.green})`, color:'#fff', fontWeight:600, textDecoration:'none' }}>
          Ir para o login
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', background:T.bg,
      color:T.text, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${T.teal},${T.green})`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700,
            color:'#fff', margin:'0 auto 16px' }}>G</div>
          <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Criar conta</h1>
          <p style={{ fontSize:13, color:T.ter }}>GMUD Manager</p>
        </div>

        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:'28px' }}>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>Nome</label>
              <input style={inp} placeholder="Seu nome completo" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>E-mail</label>
              <input type="email" style={inp} placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>Senha</label>
              <input type="password" style={inp} placeholder="Mínimo 8 caracteres" value={password} onChange={e=>setPassword(e.target.value)}/>
              {password && <PasswordStrength password={password}/>}
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.sec, textTransform:'uppercase', letterSpacing:'.4px' }}>Confirmar senha</label>
              <input type="password" style={inp} placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)}/>
              {confirm && confirm !== password && <p style={{ fontSize:11, color:'#F87171', marginTop:4 }}>As senhas não coincidem</p>}
              {confirm && confirm === password && <p style={{ fontSize:11, color:'#34D399', marginTop:4 }}>✓ Senhas iguais</p>}
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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:T.ter }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color:T.teal, fontWeight:600, textDecoration:'none' }}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  )
}
