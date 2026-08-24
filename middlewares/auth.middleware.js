import { globalConfig } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { envValues } from '../config/envSchema.js';

async function validateApiKey(request, reply) {
  try {
    // Si no hay API_KEY configurada la validacion queda desactivada.
    if (!globalConfig.apiKey) return;

    // Solo la cabecera 'api-key': antes tambien se leia 'authorization', que es
    // donde viaja el JWT, de modo que ambos valores se pisaban entre si.
    const apiKey = request.headers['api-key'];

    if (!apiKey || apiKey !== globalConfig.apiKey) {
      return reply.status(401).send({ status: false, message: 'Unauthorized', data: null });
    }
  } catch (err) {
    request.log?.error?.(err);
    return reply.status(500).send({ status: false, message: 'API Key validation failed', data: null });
  }
}

async function validateJWT(request, reply) {
  try {
    const authHeader = request.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return reply.status(401).send({ status: false, message: 'No token provided', data: null });
    }

    try {
      const decoded = jwt.verify(token, envValues.JWT_SECRET);
      request.user = {
        userId: decoded.userId,
        roleId: decoded.roleId,
      };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return reply.status(401).send({ status: false, message: 'Token expired', data: null });
      }
      return reply.status(401).send({ status: false, message: 'Invalid token', data: null });
    }
  } catch (err) {
    request.log?.error?.(err);
    return reply.status(500).send({ status: false, message: 'Authentication middleware error', data: null });
  }
}

function applyGlobalAuth(fastify, options = {}) {
  const { useApiKey = false, publicRoutes = [], publicPrefixes = [] } = options;

  // Coincidencia exacta, no startsWith: con startsWith una ruta como
  // '/api/users/login-loquesea' tambien se habria saltado la autenticacion.
  const rutasPublicas = new Set(publicRoutes);

  fastify.addHook('onRequest', async (request, reply) => {
    const requestedUrl = request.url.split('?')[0];

    if (rutasPublicas.has(requestedUrl)) return;
    if (publicPrefixes.some((prefijo) => requestedUrl.startsWith(prefijo))) return;

    await validateJWT(request, reply);

    if (useApiKey) {
      await validateApiKey(request, reply);
    }
  });
}

export { validateApiKey, validateJWT, applyGlobalAuth };
