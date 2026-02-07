import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import { eq, count, avg, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GenerateExcuseBody {
  situation: string;
  tone: string;
  length: string;
}

interface AdjustExcuseBody {
  originalExcuse: string;
  situation: string;
  tone: string;
  length: string;
  direction: 'better' | 'worse';
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
            situation: { type: 'string', description: 'The situation (e.g., "Late to work")' },
            tone: { type: 'string', description: 'The tone (e.g., "Believable", "Absurd")' },
            length: { type: 'string', description: 'The length (e.g., "Quick one-liner")' },
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
      const { situation, tone, length } = request.body;

      app.logger.info({ situation, tone, length }, 'Generating excuse');

      try {
        const systemPrompt = `You are a creative excuse generator. Generate witty, contextual excuses based on the user's specifications.
Include a believability rating (0-100) at the end of your response in the format "BELIEVABILITY: [number]".
Make sure the excuse matches the requested tone and length.`;

        const userPrompt = `Generate an excuse for the following:
Situation: ${situation}
Tone: ${tone}
Length: ${length}

Provide a creative excuse that fits these parameters. End with "BELIEVABILITY: [0-100]" where you rate how believable the excuse is.`;

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
      const { originalExcuse, situation, tone, length, direction } = request.body;

      app.logger.info(
        { situation, direction, originalExcuse: originalExcuse.substring(0, 50) },
        'Adjusting excuse'
      );

      try {
        const directionText = direction === 'better' ? 'more believable and realistic' : 'more absurd and over-the-top';

        const systemPrompt = `You are an expert at refining excuses. Take an existing excuse and make it ${directionText}.
Include a believability rating (0-100) at the end of your response in the format "BELIEVABILITY: [number]".`;

        const userPrompt = `Original excuse: "${originalExcuse}"

Situation: ${situation}
Tone: ${tone}
Length: ${length}
Direction: Make it ${directionText}

Refine this excuse while maintaining the specified tone and length. End with "BELIEVABILITY: [0-100]".`;

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

  // Rating System Endpoints
  fastify.post<{ Params: { excuseId: string }; Body: { rating: number } }>(
    '/api/excuses/:excuseId/rate',
    {
      schema: {
        description: 'Rate an excuse (1-5)',
        tags: ['excuses', 'ratings'],
        params: {
          type: 'object',
          properties: {
            excuseId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'number', minimum: 1, maximum: 5 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              averageRating: { type: 'number' },
              totalRatings: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { excuseId: string }; Body: { rating: number } }>,
      reply: FastifyReply
    ) => {
      const { excuseId } = request.params;
      const { rating } = request.body;

      app.logger.info({ excuseId, rating }, 'Rating excuse');

      try {
        // Insert rating
        await app.db
          .insert(schema.excuseRatings)
          .values({
            excuseId,
            rating,
          });

        // Get average rating and total count
        const [result] = await app.db
          .select({
            averageRating: avg(schema.excuseRatings.rating),
            totalRatings: count(schema.excuseRatings.id),
          })
          .from(schema.excuseRatings)
          .where(eq(schema.excuseRatings.excuseId, excuseId));

        app.logger.info(
          { excuseId, averageRating: result?.averageRating, totalRatings: result?.totalRatings },
          'Excuse rated successfully'
        );

        return {
          success: true,
          averageRating: result?.averageRating ? parseFloat(result.averageRating.toString()) : 0,
          totalRatings: result?.totalRatings ? (result.totalRatings as number) : 0,
        };
      } catch (error) {
        app.logger.error({ err: error, excuseId, rating }, 'Failed to rate excuse');
        throw error;
      }
    }
  );

  fastify.get<{ Params: { excuseId: string } }>(
    '/api/excuses/:excuseId/rating',
    {
      schema: {
        description: 'Get rating statistics for an excuse',
        tags: ['excuses', 'ratings'],
        params: {
          type: 'object',
          properties: {
            excuseId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              averageRating: { type: 'number' },
              totalRatings: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { excuseId: string } }>, reply: FastifyReply) => {
      const { excuseId } = request.params;

      app.logger.info({ excuseId }, 'Fetching excuse rating');

      try {
        const [result] = await app.db
          .select({
            averageRating: avg(schema.excuseRatings.rating),
            totalRatings: count(schema.excuseRatings.id),
          })
          .from(schema.excuseRatings)
          .where(eq(schema.excuseRatings.excuseId, excuseId));

        app.logger.info(
          { excuseId, averageRating: result?.averageRating, totalRatings: result?.totalRatings },
          'Retrieved excuse rating'
        );

        return {
          averageRating: result?.averageRating ? parseFloat(result.averageRating.toString()) : 0,
          totalRatings: result?.totalRatings ? (result.totalRatings as number) : 0,
        };
      } catch (error) {
        app.logger.error({ err: error, excuseId }, 'Failed to fetch excuse rating');
        throw error;
      }
    }
  );

  fastify.get<{ Querystring: { limit?: string } }>(
    '/api/excuses/top-rated',
    {
      schema: {
        description: 'Get top-rated excuses',
        tags: ['excuses', 'ratings'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                excuse: { type: 'string' },
                situation: { type: 'string' },
                averageRating: { type: 'number' },
                totalRatings: { type: 'number' },
                shareCount: { type: 'number' },
                excuseId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

      app.logger.info({ limit }, 'Fetching top-rated excuses');

      try {
        const results = await app.db
          .select({
            excuseId: schema.excuses.id,
            excuse: schema.excuses.excuse,
            situation: schema.excuses.situation,
            averageRating: avg(schema.excuseRatings.rating),
            totalRatings: count(schema.excuseRatings.id),
            shareCount: count(schema.excuseShares.id),
          })
          .from(schema.excuses)
          .leftJoin(schema.excuseRatings, eq(schema.excuses.id, schema.excuseRatings.excuseId))
          .leftJoin(schema.excuseShares, eq(schema.excuses.id, schema.excuseShares.excuseId))
          .groupBy(schema.excuses.id)
          .orderBy(sql`AVG(${schema.excuseRatings.rating}) DESC`)
          .limit(limit);

        const formattedResults = results.map((r) => ({
          excuseId: r.excuseId,
          excuse: r.excuse,
          situation: r.situation,
          averageRating: r.averageRating ? parseFloat(r.averageRating.toString()) : 0,
          totalRatings: r.totalRatings ? (r.totalRatings as number) : 0,
          shareCount: r.shareCount ? (r.shareCount as number) : 0,
        }));

        app.logger.info({ count: formattedResults.length }, 'Retrieved top-rated excuses');

        return formattedResults;
      } catch (error) {
        app.logger.error({ err: error, limit }, 'Failed to fetch top-rated excuses');
        throw error;
      }
    }
  );

  // Share Tracking Endpoints
  fastify.post<{ Params: { excuseId: string }; Body: { shareMethod: string } }>(
    '/api/excuses/:excuseId/share',
    {
      schema: {
        description: 'Track an excuse share',
        tags: ['excuses', 'shares'],
        params: {
          type: 'object',
          properties: {
            excuseId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['shareMethod'],
          properties: {
            shareMethod: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              totalShares: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { excuseId: string }; Body: { shareMethod: string } }>,
      reply: FastifyReply
    ) => {
      const { excuseId } = request.params;
      const { shareMethod } = request.body;

      app.logger.info({ excuseId, shareMethod }, 'Tracking excuse share');

      try {
        // Insert share record
        await app.db
          .insert(schema.excuseShares)
          .values({
            excuseId,
            shareMethod,
          });

        // Get total share count
        const [result] = await app.db
          .select({ totalShares: count(schema.excuseShares.id) })
          .from(schema.excuseShares)
          .where(eq(schema.excuseShares.excuseId, excuseId));

        app.logger.info(
          { excuseId, shareMethod, totalShares: result?.totalShares },
          'Share tracked successfully'
        );

        return {
          success: true,
          totalShares: result?.totalShares ? (result.totalShares as number) : 0,
        };
      } catch (error) {
        app.logger.error({ err: error, excuseId, shareMethod }, 'Failed to track share');
        throw error;
      }
    }
  );

  // Favorites Endpoints
  fastify.post<{ Body: { excuseId: string; deviceId: string } }>(
    '/api/favorites',
    {
      schema: {
        description: 'Add an excuse to favorites',
        tags: ['favorites'],
        body: {
          type: 'object',
          required: ['excuseId', 'deviceId'],
          properties: {
            excuseId: { type: 'string' },
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              favorite: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  excuseId: { type: 'string' },
                  deviceId: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { excuseId: string; deviceId: string } }>,
      reply: FastifyReply
    ) => {
      const { excuseId, deviceId } = request.body;

      app.logger.info({ excuseId, deviceId }, 'Adding excuse to favorites');

      try {
        const [favorite] = await app.db
          .insert(schema.favorites)
          .values({
            excuseId,
            deviceId,
          })
          .returning();

        app.logger.info({ favoriteId: favorite.id, excuseId, deviceId }, 'Added to favorites');

        return {
          success: true,
          favorite: {
            id: favorite.id,
            excuseId: favorite.excuseId,
            deviceId: favorite.deviceId,
            createdAt: favorite.createdAt.toISOString(),
          },
        };
      } catch (error) {
        app.logger.error({ err: error, excuseId, deviceId }, 'Failed to add to favorites');
        throw error;
      }
    }
  );

  fastify.delete<{ Params: { excuseId: string }; Querystring: { deviceId?: string } }>(
    '/api/favorites/:excuseId',
    {
      schema: {
        description: 'Remove an excuse from favorites',
        tags: ['favorites'],
        params: {
          type: 'object',
          properties: {
            excuseId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { excuseId: string }; Querystring: { deviceId?: string } }>,
      reply: FastifyReply
    ) => {
      const { excuseId } = request.params;
      const { deviceId } = request.query;

      app.logger.info({ excuseId, deviceId }, 'Removing excuse from favorites');

      try {
        if (!deviceId) {
          throw new Error('deviceId query parameter is required');
        }

        await app.db
          .delete(schema.favorites)
          .where(
            sql`${schema.favorites.excuseId} = ${excuseId} AND ${schema.favorites.deviceId} = ${deviceId}`
          );

        app.logger.info({ excuseId, deviceId }, 'Removed from favorites');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, excuseId, deviceId }, 'Failed to remove from favorites');
        throw error;
      }
    }
  );

  fastify.get<{ Querystring: { deviceId?: string } }>(
    '/api/favorites',
    {
      schema: {
        description: 'Get favorite excuses for a device',
        tags: ['favorites'],
        querystring: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                excuseId: { type: 'string' },
                excuse: { type: 'string' },
                situation: { type: 'string' },
                tone: { type: 'string' },
                length: { type: 'string' },
                averageRating: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { deviceId?: string } }>, reply: FastifyReply) => {
      const { deviceId } = request.query;

      app.logger.info({ deviceId }, 'Fetching favorite excuses');

      try {
        if (!deviceId) {
          throw new Error('deviceId query parameter is required');
        }

        const results = await app.db
          .select({
            id: schema.favorites.id,
            excuseId: schema.excuses.id,
            excuse: schema.excuses.excuse,
            situation: schema.excuses.situation,
            tone: schema.excuses.tone,
            length: schema.excuses.length,
            averageRating: avg(schema.excuseRatings.rating),
            createdAt: schema.favorites.createdAt,
          })
          .from(schema.favorites)
          .innerJoin(schema.excuses, eq(schema.favorites.excuseId, schema.excuses.id))
          .leftJoin(schema.excuseRatings, eq(schema.excuses.id, schema.excuseRatings.excuseId))
          .where(eq(schema.favorites.deviceId, deviceId))
          .groupBy(schema.favorites.id, schema.excuses.id)
          .orderBy(sql`${schema.favorites.createdAt} DESC`);

        const formattedResults = results.map((r) => ({
          id: r.id,
          excuseId: r.excuseId,
          excuse: r.excuse,
          situation: r.situation,
          tone: r.tone,
          length: r.length,
          averageRating: r.averageRating ? parseFloat(r.averageRating.toString()) : 0,
          createdAt: r.createdAt.toISOString(),
        }));

        app.logger.info({ deviceId, count: formattedResults.length }, 'Retrieved favorite excuses');

        return formattedResults;
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to fetch favorite excuses');
        throw error;
      }
    }
  );

  fastify.delete<{ Querystring: { deviceId?: string } }>(
    '/api/favorites/clear',
    {
      schema: {
        description: 'Clear all favorites for a device',
        tags: ['favorites'],
        querystring: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              deletedCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { deviceId?: string } }>, reply: FastifyReply) => {
      const { deviceId } = request.query;

      app.logger.info({ deviceId }, 'Clearing all favorites');

      try {
        if (!deviceId) {
          throw new Error('deviceId query parameter is required');
        }

        const result = await app.db
          .delete(schema.favorites)
          .where(eq(schema.favorites.deviceId, deviceId));

        const deletedCount = (result as any).rowCount || 0;

        app.logger.info({ deviceId, deletedCount }, 'Favorites cleared');

        return {
          success: true,
          deletedCount,
        };
      } catch (error) {
        app.logger.error({ err: error, deviceId }, 'Failed to clear favorites');
        throw error;
      }
    }
  );
}
