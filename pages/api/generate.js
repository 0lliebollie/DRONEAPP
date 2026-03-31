export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { location, altitude, timeOfDay, season } = req.body;
  if (!location) return res.status(400).json({ error: 'Location required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `You are a drone photography prompt engineer. For location: "${location}" at ${altitude}m altitude, ${timeOfDay} lighting, ${season} season:

1. Write a vivid 2-sentence aerial photo description.
2. Write a concise image generation prompt under 40 words, starting with "Aerial drone photo of".
3. List 4 short comma-separated tags.

Reply ONLY in this exact format:
DESC: <description>
PROMPT: <image prompt>
TAGS: <tag1>, <tag2>, <tag3>, <tag4>`
        }]
      })
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.map(b => b.text || '').join('') || '';

    const descMatch = text.match(/DESC:\s*(.+?)(?=\nPROMPT:)/s);
    const promptMatch = text.match(/PROMPT:\s*(.+?)(?=\nTAGS:)/s);
    const tagsMatch = text.match(/TAGS:\s*(.+)/);

    const description = descMatch ? descMatch[1].trim() : '';
    const imagePrompt = promptMatch ? promptMatch[1].trim() : `Aerial drone photo of ${location}, ${altitude}m, ${timeOfDay}, ${season}`;
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];

    const encodedPrompt = encodeURIComponent(`${imagePrompt}, ultra detailed, 4k, photorealistic, drone photography`);
    const seed = Math.floor(Math.random() * 99999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

    return res.status(200).json({ imageUrl, description, tags, imagePrompt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
