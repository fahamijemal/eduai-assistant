import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

let genAI;
let model;

function getModel() {
  if (!model) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
}

/**
 * Helper: send prompt to Gemini and return text response.
 */
async function generate(prompt, systemInstruction = '') {
  const m = getModel();
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  });
  return result.response.text();
}

/**
 * Helper: send prompt expecting JSON, parse and return.
 */
async function generateJSON(prompt, systemInstruction = '') {
  const text = await generate(prompt, systemInstruction);
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

// ── Public API ───────────────────────────────────────────────

/**
 * Answer a question using the given document context.
 */
export async function askQuestion(context, question) {
  const systemInstruction = `You are EduAI, an expert learning assistant. Answer questions accurately based on the provided study material. If the answer is not in the material, say so clearly. Be concise but thorough.`;

  const prompt = `Study Material:\n"""\n${context}\n"""\n\nStudent Question: ${question}\n\nProvide a clear, educational answer.`;

  return generate(prompt, systemInstruction);
}

/**
 * Summarize document text.
 */
export async function summarizeText(text) {
  const systemInstruction = `You are EduAI, a learning assistant. Create clear, well-structured summaries of study material. Use bullet points and section headings.`;

  const prompt = `Summarize the following study material:\n"""\n${text}\n"""\n\nProvide a comprehensive summary with key concepts, important details, and main takeaways.`;

  return generate(prompt, systemInstruction);
}

/**
 * Compare two documents / passages.
 */
export async function compareDocuments(textA, textB, userPrompt) {
  const systemInstruction = `You are EduAI, a learning assistant specialized in cross-document analysis. Compare the two documents and identify similarities, differences, and any contradictions. Be specific and cite from each document.`;

  const prompt = `Document A:\n"""\n${textA}\n"""\n\nDocument B:\n"""\n${textB}\n"""\n\nComparison Request: ${userPrompt || 'Compare these two documents, highlighting similarities, differences, and any contradictions.'}`;

  return generate(prompt, systemInstruction);
}

/**
 * Generate quiz questions from text.
 * Returns JSON array of questions.
 */
export async function generateQuiz(text, topic, difficulty = 'medium', count = 5) {
  const systemInstruction = `You are EduAI, a quiz generation engine. Generate multiple-choice questions in JSON format. Each question must have exactly 4 options with one correct answer.`;

  const prompt = `Generate ${count} ${difficulty}-difficulty multiple-choice questions about "${topic}" from this material:\n"""\n${text}\n"""\n\nReturn ONLY a JSON array with this structure:\n[\n  {\n    "question": "...",\n    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n    "correctAnswer": "A",\n    "explanation": "...",\n    "topic": "..."\n  }\n]`;

  return generateJSON(prompt, systemInstruction);
}

/**
 * Extract hierarchical topics from text.
 * Returns JSON array of topics with subtopics.
 */
export async function extractTopics(text) {
  const systemInstruction = `You are EduAI, a topic extraction engine. Analyze study material and extract a structured topic hierarchy. Be thorough and specific.`;

  const prompt = `Analyze this study material and extract all topics and subtopics:\n"""\n${text}\n"""\n\nReturn ONLY a JSON array with this structure:\n[\n  {\n    "topic": "Main Topic Name",\n    "subtopics": ["Subtopic 1", "Subtopic 2"],\n    "keywords": ["keyword1", "keyword2"]\n  }\n]`;

  return generateJSON(prompt, systemInstruction);
}
