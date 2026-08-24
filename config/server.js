import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import fastifyFormbody from '@fastify/formbody';

import router from '../routes/index.js';  
import { handleError, handleNotFound } from '../middlewares/error.middleware.js';  

import UsersMiddleware from '../middlewares/users.middleware.js';  

import { applyGlobalAuth } from '../middlewares/auth.middleware.js';
import { globalConfig } from './env.js';
import fastifyMultipart from '@fastify/multipart';

const fastify = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024,
  // El backend no publica puerto: solo lo alcanza nginx por la red interna de
  // compose. Confiar en X-Forwarded-For permite que el limitador de peticiones
  // vea la IP real del cliente y no la del contenedor del proxy.
  trustProxy: true,
});

// Middlewares de seguridad y parsing
fastify.register(fastifyHelmet, { contentSecurityPolicy: false });
fastify.register(fastifyFormbody);
fastify.register(compress);

// Limite global de peticiones. Las rutas publicas de autenticacion aplican un
// limite mucho mas estricto en routes/users.routes.js.
fastify.register(fastifyRateLimit, {
  global: true,
  max: 300,
  timeWindow: '1 minute',
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  attachFieldsToBody: false 
})

// En el despliegue con docker, nginx sirve el frontend y hace proxy de /api/,
// asi que todo es mismo origen y no hace falta CORS. CORS_ORIGIN solo se
// rellena para desarrollo local (por ejemplo http://localhost:5173).
const origenesPermitidos = globalConfig.corsOrigin
  ? globalConfig.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : false;

fastify.register(fastifyCors, {
  origin: origenesPermitidos,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fastify.register(import('@fastify/static'), {
  root: path.join(dirname(__dirname), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false 
});

// Decoraciones para los middleware
fastify.decorate('usersMiddleware', UsersMiddleware)

// Método helper para respuestas exitosas
fastify.decorateReply('sendSuccess', function({
  status     = true,
  statusCode = 200,
  message    = 'Operación exitosa',
  data       = null,
}) {
  this.status(statusCode).send({ status, message, data });
});

// =========================== //
// 🔒 Aplica protección global //
// =========================== //
applyGlobalAuth(fastify, {
  useApiKey: true, // true si quieres validar también API Key
  publicRoutes: [
    '/api/health',
    '/api/health/',
    '/api/users/login',
    '/api/users/refresh-token',
    '/api/users/logout',
    '/api/users/request-password-reset',
    '/api/users/reset-password',
  ],
  // Prefijos publicos: todo lo que cuelgue de estas rutas queda sin auth.
  publicPrefixes: [
    '/uploads/',
  ]
});

// Rutas bajo /api
fastify.register(router, { prefix: '/api' });

// Handlers de error y ruta no encontrada
fastify.setErrorHandler(handleError);
fastify.setNotFoundHandler(handleNotFound);

// Ruta raíz de comprobación
fastify.get('/', async (request, reply) => {
  return reply.sendSuccess({
    message: 'API is running',
    data: {}
  });
});

export default fastify;
