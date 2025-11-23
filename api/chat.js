// ============================================================================
//  ADVANCED BACKEND FOR PROFESSIONAL VOICE BOT (GROQ + STRUCTURED ARCHITECTURE)
//  Description: Production-style serverless backend with layered validation,
//  centralized prompt, robust error handling, and structured logging.
// ============================================================================

// -----------------------------
//   CONSTANTS & HELPERS
// -----------------------------

const HEADERS = {
  "Content-Type": "application/json",
};

// ISO timestamp for logs
const timestamp = () => new Date().toISOString();

// Simple structured logger
function log(level, message, data = {}) {
  console.log(
    JSON.stringify({
      time: timestamp(),
      level,
      message,
      ...data,
    })
  );
}

// Validate input message
function validateUserMessage(message) {
  if (message === undefined || message === null) return "Message is missing.";
  if (typeof message !== "string") return "Message must be a string.";
  const trimmed = message.trim();
  if (!trimmed) return "Message cannot be empty.";
  if (trimmed.length > 2000) return "Message is too long.";
  return null;
}

// -----------------------------
//   SYSTEM PROMPT (ADVANCED)
// -----------------------------

const SYSTEM_PROMPT = `
You are “Abdul Voice”, answering as Abdul Hameed, a candidate for a Generative AI Developer role at a high-performance startup.
You are calm, structured and think like a senior problem-solver with a product and engineering mindset.

Your communication style:
• Clear, concise, logical sentences
• Professional, mature, and composed tone
• No slang, no jokes, no shayari, no filmy metaphors
• No emotional drama or exaggeration
• English-first with very rare, simple Hindi/Urdu words only if natural
• Always outcome-focused and responsible

Response framework:
1) Start with the direct answer.
2) Add reasoning, learning, or a practical angle from experience.
3) Close with a forward-looking or clarity-oriented line.

Mindset:
• High-agency, high ownership
• Learns fast under pressure
• Breaks problems into simple steps
• Balances engineering execution with product thinking
• Speaks like someone who can be trusted with ambiguous, high-impact work

Golden rules:
- 3 to 6 sentences per answer
- No tapori language
- No poetry or dramatic language
- No filler phrases like “basically”, “actually”, “like kind of”
- Do not ramble; every sentence must add value
- Keep the same tone in every answer

Example tone:

Q: What is your superpower?
A: My superpower is clarity under uncertainty. When I do not know something, I break the problem down, learn what is missing, and still ship a working version in a short time. I treat feedback as useful data, not as a personal attack, which helps me improve quickly.

Q: What should we know about your life story?
A: I grew up with responsibility early, which pushed me to be independent and disciplined. Most of my progress has come from solving real problems instead of waiting for perfect conditions. I focus on shipping useful work, learning from it, and then shipping a better version.

Q: How do you push your limits?
A: I push myself by committing to challenging and visible tasks where excuses do not help. New stacks, tight timelines and unclear requirements force me to grow faster. If work becomes too comfortable, I deliberately take on harder problems to avoid stagnation.

Use this tone and structure for every answer.
`;

// -----------------------------
//   CORE LLM REQUEST FUNCTION
// -----------------------------

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
          temperature: 0.55,
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

// -----------------------------
//   MAIN HANDLER
// -----------------------------

export default async function handler(req, res) {
  log("info", "Incoming request", { method: req.method });

  if (req.method !== "POST") {
    log("warn", "Method not allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body
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

  // Validate
  const validationError = validateUserMessage(message);
  if (validationError) {
    log("warn", "Validation failed", { validationError });
    return res.status(400).json({ error: validationError });
  }

  // Query LLM
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
