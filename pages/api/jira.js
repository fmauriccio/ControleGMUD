import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { jiraUrl, email, token, jql, maxResults = 100 } = req.body

  if (!jiraUrl || !email || !token || !jql) {
    return res.status(400).json({ error: 'Campos obrigatórios: jiraUrl, email, token, jql' })
  }

  const cleanUrl = jiraUrl.replace(/\/$/, '')
  const auth = Buffer.from(`${email}:${token}`).toString('base64')
  const fields = 'summary,status,assignee,priority,issuetype,created,updated,labels,fixVersions,flagged,customfield_10021,customfield_10016,customfield_10028,story_points'

  try {
    let allIssues = []
    let startAt = 0
    const pageSize = 100 // Jira max per page

    // Paginate until all cards are fetched
    while (true) {
      const url = `${cleanUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${pageSize}&fields=${fields}`

      const response = await fetch(url, {
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

      const issues = data.issues || []
      allIssues = [...allIssues, ...issues]

      const total = data.total || 0
      startAt += issues.length

      // Stop if we got all issues or received empty page
      if (startAt >= total || issues.length === 0) break

      // Safety limit: max 2000 cards
      if (allIssues.length >= 2000) break
    }

    return res.status(200).json({
      issues: allIssues,
      total: allIssues.length
    })

  } catch (err) {
    return res.status(500).json({ error: `Erro ao conectar ao Jira: ${err.message}` })
  }
}
