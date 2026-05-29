export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { jiraUrl, email, token, jql } = req.body
  if (!jiraUrl || !email || !token || !jql)
    return res.status(400).json({ error: 'Campos obrigatórios: jiraUrl, email, token, jql' })

  const cleanUrl = jiraUrl.replace(/\/$/, '')
  const auth = Buffer.from(`${email}:${token}`).toString('base64')
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' }
  const fields = ['summary','status','assignee','priority','issuetype','created','updated','labels',
    'flagged','customfield_10021','customfield_10016','customfield_10028'].join(',')

  try {
    let allIssues = []
    let nextPageToken = null

    while (true) {
      // Build URL — add nextPageToken when paginating
      const params = new URLSearchParams({
        jql,
        maxResults: '100',
        fields,
        ...(nextPageToken ? { nextPageToken } : {})
      })
      const url = `${cleanUrl}/rest/api/3/search/jql?${params}`
      const resp = await fetch(url, { headers })
      const data = await resp.json()

      if (!resp.ok) {
        return res.status(resp.status).json({
          error: data.errorMessages?.[0] || data.message || `Erro HTTP ${resp.status}`
        })
      }

      const issues = data.issues || []
      allIssues = [...allIssues, ...issues]

      // New endpoint uses cursor pagination
      if (data.nextPageToken && issues.length > 0 && allIssues.length < 2000) {
        nextPageToken = data.nextPageToken
      } else {
        break
      }
    }

    return res.status(200).json({ issues: allIssues, total: allIssues.length })
  } catch (err) {
    return res.status(500).json({ error: `Erro ao conectar ao Jira: ${err.message}` })
  }
}
