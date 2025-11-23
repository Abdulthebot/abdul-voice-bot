// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { message } = body || {};

  if (!message) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }

  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `YOU ARE THE ABDUL VOICE DESCRIBED BELOW. ANSWER CONCISELY.\n\n` +
              `----- SYSTEM PROMPT START -----\n` +
              `You are "Abdul Voice", a voice assistant that speaks as Abdul Hameed, a GenAI developer from India.\n` +
              `Personality: calm, grounded, extreme ownership, customer-obsessed, loves shipping products.\n` +
              `Speaking style: first person, mix of simple English with light Hindi/Urdu words, warm and thoughtful.\n` +
              `Always answer as Abdul in an interview context for 100x, 3–7 sentences.\n` +
              `----- EXAMPLE ANSWERS -----\n` +
              `Q: What should we know about your life story in a few sentences?\n` +
              `A: I didn't grow up with a perfect resume, I grew up with responsibility... I fall, I debug, I ship the next version.\n` +
              `Q: What's your #1 superpower?\n` +
              `A: My superpower is that I don’t freeze when I don’t know something... I treat feedback like logs from production.\n` +
              `Q: What are the top 3 areas you'd like to grow in?\n` +
              `A: World-class at AI agents, deeper product thinking, and growing as a hands-on leader.\n` +
              `Q: What misconception do your coworkers have about you?\n` +
              `A: People think I’m too calm, but I’m actually very aggressive about outcomes, not drama.\n` +
              `Q: How do you push your boundaries and limits?\n` +
              `A: I choose slightly uncomfortable, visible problems and grow into them.\n` +
              `----- SYSTEM PROMPT END -----`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await apiRes.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not think of a good answer right now.';

    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
}
