import UsersController from '../controllers/users.controller.js';
import UsersMiddleware from '../middlewares/users.middleware.js'; 
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function usersRoutes(fastify) {
  // ==========================================================
  // --- Rutas Públicas (No requieren autenticación) ---
  // ==========================================================
  fastify.post('/login', { compress: false, preHandler: UsersMiddleware.loginUser }, UsersController.loginUser);
  fastify.post('/refresh-token', { preHandler: UsersMiddleware.refreshToken }, UsersController.refreshToken);
  fastify.post('/logout', { preHandler: UsersMiddleware.logout }, UsersController.logout);

  fastify.post('/request-password-reset', { preHandler: UsersMiddleware.requestPasswordReset }, UsersController.requestPasswordReset);
  fastify.post('/reset-password', { preHandler: UsersMiddleware.resetPassword }, UsersController.resetPassword);


  // ====================================================================
  // --- Rutas Privadas (Requieren Access Token y validación de rol) ---
  // ====================================================================

  fastify.post('/create', { preHandler: [UsersMiddleware.createUser, checkPermission('Users', 'CREATE')]}, UsersController.createUser);
  fastify.get('/list', { preHandler: [UsersMiddleware.getUsers, checkPermission('Users' || 'Reports', 'READ') ]}, UsersController.getUsers);
  fastify.put('/update', { preHandler: [UsersMiddleware.updateUser, checkPermission('Users', 'UPDATE') ]}, UsersController.updateUser);
  fastify.delete('/delete/:user_id', { preHandler: [UsersMiddleware.deleteUser, checkPermission('Users', 'DELETE') ]}, UsersController.deleteUser);
} 