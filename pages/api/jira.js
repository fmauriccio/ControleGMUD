export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jiraUrl, email, token, jql, maxResults = 100 } = req.body

  if (!jiraUrl || !email || !token || !jql) {
    return res.status(400).json({ error: 'Campos obrigatórios: jiraUrl, email, token, jql' })
  }

  const cleanUrl = jiraUrl.replace(/\/$/, '')
  const auth = Buffer.from(`${email}:${token}`).toString('base64')
  const fields = 'summary,status,assignee,priority,issuetype,created,updated,labels,fixVersions'
  const apiUrl = `${cleanUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${fields}`

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.errorMessages?.[0] || data.message || `Erro HTTP ${response.status}`,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: `Erro ao conectar ao Jira: ${err.message}` })
  }
}
