import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import compress from '@fastify/compress';
import fastifyFormbody from '@fastify/formbody';

import router from '../routes/index.js';  
import { handleError, handleNotFound } from '../middlewares/error.middleware.js';  

import UsersMiddleware from '../middlewares/users.middleware.js';  

import { applyGlobalAuth } from '../middlewares/auth.middleware.js';
import fastifyMultipart from '@fastify/multipart';

const fastify = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024,
});

// Middlewares de seguridad y parsing
fastify.register(fastifyHelmet, { contentSecurityPolicy: false });
fastify.register(fastifyFormbody);
fastify.register(compress);
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  attachFieldsToBody: false 
})
fastify.register(fastifyCors, {
  origin: true,
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
    '/api/users/login',
    '/api/users/refresh-token',
    '/api/users/logout',
    '/api/users/request-password-reset',
    '/api/users/reset-password',
    '/uploads/'        
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
