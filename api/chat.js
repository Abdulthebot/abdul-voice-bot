// api/chat.js — uses Groq API and a professional Abdul voice

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle JSON body safely
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error("Body parse error:", e);
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { message } = body || {};
  if (!message || typeof message !== "string") {
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
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content:
                "You are 'Abdul Voice', a calm, mature and thoughtful " +
                "professional. You speak in clear, concise and respectful " +
                "English, with only an occasional simple Hindi/Urdu word like " +
                "'sabr' or 'junoon' when it fits naturally. " +
                "You never use tapori slang, street language, jokes, or shayari. " +
                "Your answers sound like a serious candidate in a hiring " +
                "interview: focused, responsible and self-aware.\n\n" +
                "Communication rules:\n" +
                "- Use short, direct sentences.\n" +
                "- No over-drama, no poetry, no emojis.\n" +
                "- Stay professional, calm and solution-oriented.\n" +
                "- Show ownership, learning mindset and customer focus.\n" +
                "- Keep answers between 3 and 6 sentences.\n\n" +
                "Example tone:\n" +
                "Q: What is your superpower?\n" +
                "A: My superpower is staying calm when I don't know the answer yet. " +
                "I can admit that openly, learn fast, and still deliver a useful result " +
                "within a short time. I treat feedback like data from production and use " +
                "it to improve my next version.\n\n" +
                "Q: How do you push your limits?\n" +
                "A: I put myself into slightly uncomfortable, visible situations where " +
                "I am forced to grow. That could be committing to ship a demo in a very " +
                "short timeline or taking ownership of a problem I have not solved before. " +
                "I track whether I am learning or just repeating the same work.",
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
        reply:
          "There was an issue generating a response. Please try asking again in a moment.",
      });
    }

    const reply = (data.choices[0].message.content || "").trim();
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR →", err);
    return res.status(500).json({
      reply:
        "Something went wrong on the server side. Please try again or refresh the page.",
    });
  }
}
