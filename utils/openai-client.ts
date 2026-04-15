/**
 * OpenAI client wrapper — single configured instance for all agents.
 * Reads credentials from environment variables.
 */
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error('OpenAIClient', 'OPENAI_API_KEY is not set in environment. Please configure .env file.');
  process.exit(1);
}

export const openaiClient = new OpenAI({ apiKey });

export const AI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
export const AI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS ?? '4096', 10);
export const AI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.2');

/**
 * Sends a system + user prompt to OpenAI and returns the raw text response.
 * Handles basic error wrapping with context.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  context = 'Agent'
): Promise<string> {
  logger.info(context, `Calling ${AI_MODEL} (max_tokens=${AI_MAX_TOKENS}, temp=${AI_TEMPERATURE})`);

  const response = await openaiClient.chat.completions.create({
    model: AI_MODEL,
    temperature: AI_TEMPERATURE,
    max_tokens: AI_MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`[${context}] OpenAI returned an empty response.`);
  }

  logger.debug(context, `Usage: ${JSON.stringify(response.usage)}`);
  return content;
}
