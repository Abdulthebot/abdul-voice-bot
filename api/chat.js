// api/chat.js  — uses Groq instead of OpenAI

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const { message } = body || {};
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const apiRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "You are Abdul Voice, a calm, grounded and reflective person. " +
                "You speak in short meaningful sentences with light Urdu/Hindi touches. " +
                "You answer interview-style questions about your life story, superpower, " +
                "growth areas, misconceptions, and how you push your limits.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await apiRes.json();

    if (!data.choices || !data.choices[0]) {
      console.error("GROQ ERROR →", data);
      return res.status(500).json({
        reply: "Yaar, kuch gadbad ho gayi. Ek baar phir try karte hain.",
      });
    }

    const reply = data.choices[0].message.content.trim();
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR →", err);
    return res.status(500).json({
      reply: "Andar se kuch toot gaya lagta hai, thodi der baad phir se puchna.",
    });
  }
}
