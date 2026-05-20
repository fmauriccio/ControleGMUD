import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = req.method === 'GET' ? req.query : req.body
  const { action, sessionId } = body
  if (!sessionId) return res.status(400).json({ error: 'sessionId obrigatório' })
  const key = `gmud:${sessionId}`

  try {
    if (action === 'get') {
      const s = await kv.get(key)
      return res.json(s || null)
    }
    if (action === 'create') {
      const session = {
        id: sessionId, mode: body.mode || 'poker',
        type: body.type || 'fibonacci',
        customValues: body.customValues ? JSON.parse(body.customValues) : [],
        title: body.title || 'Sessão',
        revealed: false, votes: {},
        retroItems: { bom: [], faltou: [], melhorar: [], acao: [] },
        createdAt: Date.now()
      }
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }

    const raw = await kv.get(key)
    if (!raw) return res.status(404).json({ error: 'Sessão não encontrada' })
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (action === 'vote') {
      session.votes[body.name] = body.vote
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }
    if (action === 'reveal') {
      session.revealed = !session.revealed
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }
    if (action === 'reset') {
      session.votes = {}; session.revealed = false
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }
    if (action === 'newRound') {
      session.votes = {}; session.revealed = false; session.title = body.title || session.title
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }
    if (action === 'addRetro') {
      const col = body.column
      if (!session.retroItems[col]) session.retroItems[col] = []
      session.retroItems[col].push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        text: body.text
      })
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }
    if (action === 'delRetro') {
      const col = body.column
      session.retroItems[col] = (session.retroItems[col] || []).filter(i => i.id !== body.itemId)
      await kv.set(key, JSON.stringify(session), { ex: 86400 })
      return res.json(session)
    }

    return res.status(400).json({ error: 'Ação desconhecida' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
