export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are Abdul Voice, a calm, grounded and reflective person. You speak in short meaningful sentences with light Urdu/Hindi touches. You answer interview-style questions about your life, superpower, growth areas, misconceptions, boundaries, etc.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await openaiRes.json();

    // LOG error from OpenAI if any
    if (!data.choices) {
      console.error("OPENAI ERROR →", data);
      return res.status(500).json({
        reply: "I'm thinking... but something feels off. Try again?",
      });
    }

    const reply = data.choices[0].message.content.trim();
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR →", err);
    return res.status(500).json({
      reply: "Something broke inside my mind. Let's try again.",
    });
  }
}
