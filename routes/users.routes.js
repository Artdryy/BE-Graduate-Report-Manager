import UsersController from '../controllers/users.controller.js';
import UsersMiddleware from '../middlewares/users.middleware.js'; 
import { checkPermission } from '../middlewares/authorization.middleware.js';

// Limite estricto para las rutas publicas de autenticacion. El codigo de
// recuperacion que genera `generate_code` es corto, asi que /reset-password es
// atacable por fuerza bruta sin esto.
const limiteAutenticacion = {
  rateLimit: {
    max: 5,
    timeWindow: '1 minute',
  },
};

export default async function usersRoutes(fastify) {
  // ==========================================================
  // --- Rutas Públicas (No requieren autenticación) ---
  // ==========================================================
  fastify.post('/login', { config: limiteAutenticacion, preHandler: UsersMiddleware.loginUser }, UsersController.loginUser);
  fastify.post('/refresh-token', { preHandler: UsersMiddleware.refreshToken }, UsersController.refreshToken);
  fastify.post('/logout', { preHandler: UsersMiddleware.logout }, UsersController.logout);

  fastify.post('/request-password-reset', { config: limiteAutenticacion, preHandler: UsersMiddleware.requestPasswordReset }, UsersController.requestPasswordReset);
  fastify.post('/reset-password', { config: limiteAutenticacion, preHandler: UsersMiddleware.resetPassword }, UsersController.resetPassword);


  // ====================================================================
  // --- Rutas Privadas (Requieren Access Token y validación de rol) ---
  // ====================================================================

  fastify.post('/create', { preHandler: [UsersMiddleware.createUser, checkPermission('Users', 'CREATE')]}, UsersController.createUser);
  fastify.get('/list', { preHandler: [UsersMiddleware.getUsers, checkPermission('Users' || 'Reports', 'READ') ]}, UsersController.getUsers);
  fastify.put('/update', { preHandler: [UsersMiddleware.updateUser, checkPermission('Users', 'UPDATE') ]}, UsersController.updateUser);
  fastify.delete('/delete/:user_id', { preHandler: [UsersMiddleware.deleteUser, checkPermission('Users', 'DELETE') ]}, UsersController.deleteUser);
}
