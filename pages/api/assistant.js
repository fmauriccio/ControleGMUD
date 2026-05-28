export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { metrics } = req.body
  if (!metrics) return res.status(400).json({ error: 'Métricas não fornecidas' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no Vercel' })

  const prompt = `Você é um especialista em metodologias ágeis e métricas de time de desenvolvimento. 
Analise as métricas abaixo de um time de software e forneça uma análise clara e objetiva em português brasileiro.

MÉTRICAS DO TIME:
${JSON.stringify(metrics, null, 2)}

Forneça:
1. **Resumo geral** do desempenho do time (2-3 frases)
2. **Pontos positivos** identificados nas métricas
3. **Alertas e gargalos** que precisam de atenção
4. **Tendências** observadas (melhora, piora, estabilidade)
5. **3 recomendações práticas** priorizadas para o Scrum Master

Seja direto, use linguagem simples e foque em ações concretas. Limite a resposta a 400 palavras.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API' })

    const text = data.content?.[0]?.text || ''
    return res.status(200).json({ analysis: text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
