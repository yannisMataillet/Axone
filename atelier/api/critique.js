export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, mimeType, systemPrompt } = req.body;

  if (!image || !mimeType || !systemPrompt) {
    return res.status(400).json({ error: 'Missing required fields: image, mimeType, systemPrompt' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: image,
              },
            },
            {
              type: 'text',
              text: 'Analyse cette image et fournis une critique architecturale détaillée.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return res.status(response.status).json({ error: error.error?.message || 'Anthropic API error' });
  }

  const data = await response.json();
  const critique = data.content?.[0]?.text ?? '';

  return res.status(200).json({ critique });
}
