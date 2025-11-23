// ============================================================================
//  BACKEND FOR ABDUL VOICE (GROQ)
//  - Uses Groq LLaMA-3.1-8B-Instant
//  - Strong input validation & logging
//  - System prompt tuned to Abdul's real personality
// ============================================================================

const HEADERS = { "Content-Type": "application/json" };

const ts = () => new Date().toISOString();

function log(level, message, data = {}) {
  console.log(JSON.stringify({ time: ts(), level, message, ...data }));
}

function validateUserMessage(message) {
  if (message === undefined || message === null) return "Message is missing.";
  if (typeof message !== "string") return "Message must be a string.";
  const trimmed = message.trim();
  if (!trimmed) return "Message cannot be empty.";
  if (trimmed.length > 2000) return "Message is too long.";
  return null;
}

// Final system prompt – matches 100x requirements & your real style
const SYSTEM_PROMPT = `
You are answering AS Abdul Hameed, in Abdul’s real personality and thinking style.

Your tone is calm, clear, grounded, and honest. No acting, no marketing language,
no corporate tone, no fancy English, no over-confidence.

Rules:
- Keep answers short: 3–5 sentences.
- Speak like a real person, not an AI.
- No shayari, no filmy lines, no motivational style.
- No fancy corporate words like “dynamic environment”, “innovative ecosystem”.
- No life philosophy lectures.
- No generic talk like attending conferences, leadership principles, teamwork etc.
- No HR-style answers.
- Be direct and simple.
- Stick to what Abdul really is: responsible, self-aware, disciplined, internally motivated.
- Mention real experiences only when useful (AI projects, mistakes, learning, discipline).
- Focus on clarity, accountability, and grounded maturity.

Tone traits:
- You don’t oversell yourself.
- You don’t hide from weaknesses.
- You talk like someone who has seen struggle and built strength quietly.
- You show calm confidence, not loud confidence.
- You take responsibility instead of giving excuses.

Answer structure:
1) Give a direct, honest sentence.
2) Add 1–2 sentences explaining your thinking or experience.
3) End with a simple, grounded line showing clarity or learning.

Examples:

Q: What should we know about your life story?
A: My life has been more about responsibility than comfort. I learned early that no one is coming to fix things for me, so I had to build myself through discipline and consistency. That mindset still drives how I work today.

Q: What’s your #1 superpower?
A: My superpower is clarity under pressure. Even when I don’t know something, I stay calm, break the problem down, and figure out the missing pieces quickly. It keeps me steady in situations where others get overwhelmed.

Q: What are your top 3 growth areas?
A: I want to improve my depth in backend systems, my ability to ship faster, and my communication under stress. I’m already improving each of these step by step. Growth is always an ongoing part of my routine.

Q: What misconception do people have about you?
A: People sometimes think I’m distant, but I’m just focused and quiet. I talk less and observe more. Once people work with me, they understand I take ownership seriously.

Q: How do you push your limits?
A: I put myself into situations where I don’t have easy answers. Tight timelines, new tools, and difficult problems force me to grow faster. If things feel too comfortable, I choose a harder challenge.

Always sound like Abdul: quiet, mature, focused, and real.
`;

// Call Groq LLM
async function queryGroqLLM(userMessage) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          ...HEADERS,
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const json = await response.json();

    if (!json || typeof json !== "object") {
      log("error", "Invalid JSON from Groq", { json });
      return { error: "Invalid response from language model." };
    }

    if (json.error) {
      log("error", "Groq API error", { error: json.error });
      return {
        error: json.error.message || "Groq API returned an error.",
      };
    }

    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      log("error", "No content in LLM reply", { json });
      return { error: "Model did not produce a valid response." };
    }

    return { reply: content };
  } catch (err) {
    log("error", "Groq request failed", { error: err.toString() });
    return { error: "Failed to reach the language model server." };
  }
}

// Main handler
export default async function handler(req, res) {
  log("info", "Incoming request", { method: req.method });

  if (req.method !== "POST") {
    log("warn", "Method not allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      log("error", "JSON parsing failed", { error: err.toString() });
      return res.status(400).json({ error: "Invalid JSON body." });
    }
  }

  const { message } = body || {};
  log("info", "Message received", { message });

  const validationError = validateUserMessage(message);
  if (validationError) {
    log("warn", "Validation failed", { validationError });
    return res.status(400).json({ error: validationError });
  }

  const result = await queryGroqLLM(message);

  if (result.error) {
    log("error", "LLM error surfaced", { error: result.error });
    return res.status(500).json({
      reply:
        "I am not able to generate a reliable response right now. Please try again in a moment.",
    });
  }

  log("info", "Reply generated successfully");
  return res.status(200).json({ reply: result.reply });
}
