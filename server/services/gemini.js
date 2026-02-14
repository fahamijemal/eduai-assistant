const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Model ───────────────────────────────────────────── */
function getModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      maxOutputTokens: 1024,   // cap output to save quota
      temperature: 0.4,        // focused, less rambling
    },
  });
}

/* ── Helpers ──────────────────────────────────────────── */

// Aggressively trim document text to save input tokens
function trimText(text, maxChars = 8000) {
  if (!text) return '';
  // Strip excessive whitespace first
  let cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.substring(0, maxChars) + ' ...[trimmed]';
}

// Sleep utility
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry wrapper: retries on 429 with exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message && err.message.includes('429');
      if (is429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000; // 2s, 4s, 8s + jitter
        console.log(`[Gemini] Rate limited, retrying in ${(wait / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

/* ── Ask Question ────────────────────────────────────── */
async function askQuestion(documentText, question) {
  try {
    const model = getModel();
    const doc = trimText(documentText, 8000);

    const prompt = `Answer based ONLY on this document. Be concise (max 200 words).

Document:
${doc}

Question: ${question}

Answer:`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    return result.response.text();
  } catch (error) {
    console.error('Gemini askQuestion error:', error.message);
    if (error.message.includes('429')) {
      throw new Error('API rate limit reached. Please wait a minute and try again.');
    }
    throw new Error('Failed to generate answer. Please try again.');
  }
}

/* ── Summarize ───────────────────────────────────────── */
async function summarize(documentText) {
  try {
    const model = getModel();
    const doc = trimText(documentText, 8000);

    const prompt = `Summarize for a student in under 300 words:
- Overview (2 sentences)
- Key points (bullets)
- Key terms

Document:
${doc}

Summary:`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    return result.response.text();
  } catch (error) {
    console.error('Gemini summarize error:', error.message);
    if (error.message.includes('429')) {
      throw new Error('API rate limit reached. Please wait a minute and try again.');
    }
    throw new Error('Failed to generate summary. Please try again.');
  }
}

/* ── Generate Quiz ───────────────────────────────────── */
async function generateQuiz(documentText) {
  try {
    const model = getModel();
    const doc = trimText(documentText, 6000);

    const prompt = `Generate a short quiz from this document. Return ONLY valid JSON, no markdown.

Format:
{"questions":[{"question":"...","options":["A)...","B)...","C)...","D)..."],"correctAnswer":0}]}

Create exactly 5 multiple-choice questions. correctAnswer is the 0-based index of the right option.

Document:
${doc}

JSON:`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    let text = result.response.text();

    // Clean up
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const quiz = JSON.parse(text);
    return quiz;
  } catch (error) {
    console.error('Gemini generateQuiz error:', error.message);
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse quiz. Please try again.');
    }
    if (error.message.includes('429')) {
      throw new Error('API rate limit reached. Please wait a minute and try again.');
    }
    throw new Error('Failed to generate quiz. Please try again.');
  }
}

module.exports = { askQuestion, summarize, generateQuiz };
