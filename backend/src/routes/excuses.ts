import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import { eq, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GenerateExcuseBody {
  situation: string;
  tone: string;
  length: string;
  seed?: string;
}

interface AdjustExcuseBody {
  originalExcuse: string;
  situation: string;
  tone: string;
  length: string;
  direction: 'better' | 'worse';
  seed?: string;
}

interface ExcuseResponse {
  excuse: string;
  believabilityRating: number;
  usageCount?: number;
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.post<{ Body: GenerateExcuseBody }>(
    '/api/excuses/generate',
    {
      schema: {
        description: 'Generate a creative excuse based on situation, tone, and length',
        tags: ['excuses'],
        body: {
          type: 'object',
          required: ['situation', 'tone', 'length'],
          properties: {
            situation: {
              type: 'string',
              description: 'The situation (e.g., "Late to work", "Why I\'m single", "Ghosting someone", "Skipping the gym", "Not replying to texts", "Missing family gathering", "Returning something late", "Why I can\'t lend money", "Avoiding phone calls", "Breaking up with someone", "Quitting a job", "Moving back home", "Why I haven\'t visited", "Can\'t make it to wedding", "Caught speeding")'
            },
            tone: { type: 'string', description: 'The tone (e.g., "Believable", "Absurd")' },
            length: { type: 'string', description: 'The length (e.g., "Quick one-liner")' },
            seed: { type: 'string', description: 'Optional seed for randomization to ensure unique outputs' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              excuse: { type: 'string' },
              believabilityRating: { type: 'number' },
              usageCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateExcuseBody }>, reply: FastifyReply) => {
      const { situation, tone, length, seed } = request.body;

      // Generate seed if not provided
      const generationSeed = seed || `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      app.logger.info({ situation, tone, length, seed: generationSeed }, 'Generating excuse');

      try {
        const systemPrompt = `You are an excuse generator. Generate creative, unique excuses that are substantially different each time.

CRITICAL: Each excuse must be completely original in wording, theme, and approach. Avoid repeating similar phrases, scenarios, or structures. Vary the subject matter, characters, locations, and circumstances in each generation.

Always include a believability rating (0-100) at the end in the format "BELIEVABILITY: [number]".`;

        const userPrompt = `Generate a creative, unique excuse for the following situation.

Situation: ${situation}
Tone: ${tone}
Length: ${length}
Seed: ${generationSeed}

Generate a completely original excuse that hasn't been used before. Make it substantially different from typical excuses - vary the subject matter, characters, locations, and circumstances. The seed value should inspire unique variations.

End with "BELIEVABILITY: [0-100]" where you rate how believable the excuse is.`;

        const { text } = await generateText({
          model: gateway('openai/gpt-5.2'),
          system: systemPrompt,
          prompt: userPrompt,
        });

        // Parse the response to extract excuse and believability rating
        const believabilityMatch = text.match(/BELIEVABILITY:\s*(\d+)/i);
        const believabilityRating = believabilityMatch ? parseInt(believabilityMatch[1], 10) : 50;
        const excuse = text.replace(/BELIEVABILITY:\s*\d+/i, '').trim();

        // Save to database
        const [saved] = await app.db
          .insert(schema.excuses)
          .values({
            situation,
            tone,
            length,
            excuse,
            believabilityRating,
          })
          .returning();

        // Count how many times this excuse has been used (all excuses for this situation)
        const [{ usageCount }] = await app.db
          .select({ usageCount: count() })
          .from(schema.excuses)
          .where(eq(schema.excuses.situation, situation));

        app.logger.info(
          { excuseId: saved.id, situation, believabilityRating },
          'Excuse generated successfully'
        );

        const response: ExcuseResponse = {
          excuse,
          believabilityRating,
          usageCount: usageCount as number,
        };

        return response;
      } catch (error) {
        app.logger.error({ err: error, situation, tone, length }, 'Failed to generate excuse');
        throw error;
      }
    }
  );

  fastify.post<{ Body: AdjustExcuseBody }>(
    '/api/excuses/adjust',
    {
      schema: {
        description: 'Adjust an existing excuse to be more or less believable',
        tags: ['excuses'],
        body: {
          type: 'object',
          required: ['originalExcuse', 'situation', 'tone', 'length', 'direction'],
          properties: {
            originalExcuse: { type: 'string', description: 'The original excuse to adjust' },
            situation: { type: 'string' },
            tone: { type: 'string' },
            length: { type: 'string' },
            direction: { type: 'string', enum: ['better', 'worse'] },
            seed: { type: 'string', description: 'Optional seed for randomization to ensure unique outputs' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              excuse: { type: 'string' },
              believabilityRating: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: AdjustExcuseBody }>, reply: FastifyReply) => {
      const { originalExcuse, situation, tone, length, direction, seed } = request.body;

      // Generate seed if not provided
      const generationSeed = seed || `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      app.logger.info(
        { situation, direction, originalExcuse: originalExcuse.substring(0, 50), seed: generationSeed },
        'Adjusting excuse'
      );

      try {
        const directionText = direction === 'better' ? 'more believable and realistic' : 'more absurd and over-the-top';

        const systemPrompt = `You are an expert at refining excuses. Take an existing excuse and make it ${directionText}.

CRITICAL: Create a unique variation that is substantially different in wording and approach from the original. Avoid copying phrases or patterns - reimagine the excuse creatively.

Include a believability rating (0-100) at the end of your response in the format "BELIEVABILITY: [number]".`;

        const userPrompt = `Original excuse: "${originalExcuse}"

Situation: ${situation}
Tone: ${tone}
Length: ${length}
Direction: Make it ${directionText}
Seed: ${generationSeed}

Refine this excuse while maintaining the specified tone and length. Create a unique variation that uses different wording, scenarios, and details from the original. The seed value should inspire creative variations.

End with "BELIEVABILITY: [0-100]".`;

        const { text } = await generateText({
          model: gateway('openai/gpt-5.2'),
          system: systemPrompt,
          prompt: userPrompt,
        });

        // Parse the response to extract excuse and believability rating
        const believabilityMatch = text.match(/BELIEVABILITY:\s*(\d+)/i);
        const believabilityRating = believabilityMatch ? parseInt(believabilityMatch[1], 10) : 50;
        const adjustedExcuse = text.replace(/BELIEVABILITY:\s*\d+/i, '').trim();

        // Save adjusted excuse to database
        const [saved] = await app.db
          .insert(schema.excuses)
          .values({
            situation,
            tone,
            length,
            excuse: adjustedExcuse,
            believabilityRating,
          })
          .returning();

        app.logger.info(
          { excuseId: saved.id, direction, believabilityRating },
          'Excuse adjusted successfully'
        );

        const response: ExcuseResponse = {
          excuse: adjustedExcuse,
          believabilityRating,
        };

        return response;
      } catch (error) {
        app.logger.error(
          { err: error, situation, direction, originalExcuse: originalExcuse.substring(0, 50) },
          'Failed to adjust excuse'
        );
        throw error;
      }
    }
  );

  fastify.get(
    '/api/excuses/ultimate',
    {
      schema: {
        description: 'Get the ultimate Easter egg excuse',
        tags: ['excuses'],
        response: {
          200: {
            type: 'object',
            properties: {
              excuse: { type: 'string' },
              believabilityRating: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching ultimate excuse');

      try {
        const systemPrompt =
          'You are a comedic genius. Generate the most absurdly hilarious, over-the-top excuse that could never be believed. Make it creative and wildly entertaining. Include a believability rating (0-100) at the end in the format "BELIEVABILITY: [number]".';

        const userPrompt =
          'Generate the ultimate, most ridiculous excuse imaginable. This should be a comedic masterpiece that is hilariously unbelievable. End with "BELIEVABILITY: [0-100]".';

        const { text } = await generateText({
          model: gateway('openai/gpt-5.2'),
          system: systemPrompt,
          prompt: userPrompt,
        });

        // Parse the response to extract excuse and believability rating
        const believabilityMatch = text.match(/BELIEVABILITY:\s*(\d+)/i);
        const believabilityRating = believabilityMatch ? parseInt(believabilityMatch[1], 10) : 0;
        const excuse = text.replace(/BELIEVABILITY:\s*\d+/i, '').trim();

        // Save ultimate excuse to database with special markers
        const [saved] = await app.db
          .insert(schema.excuses)
          .values({
            situation: 'ULTIMATE_EASTER_EGG',
            tone: 'Absurd',
            length: 'Elaborate story',
            excuse,
            believabilityRating,
          })
          .returning();

        app.logger.info({ excuseId: saved.id }, 'Ultimate excuse generated');

        const response: ExcuseResponse = {
          excuse,
          believabilityRating,
        };

        return response;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to generate ultimate excuse');
        throw error;
      }
    }
  );
}
