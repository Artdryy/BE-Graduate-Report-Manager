import RolesController from '../controllers/roles.controller.js';
import RolesMiddleware from '../middlewares/roles.middleware.js';
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function rolesRoutes(fastify) {
  fastify.post('/create', {preHandler: [RolesMiddleware.createRole, checkPermission('Roles', 'CREATE')] }, RolesController.createRole);
  fastify.get('/list', { compress: false, preHandler: [RolesMiddleware.getRoles, checkPermission('Roles' || 'Users', 'READ')] }, RolesController.getRoles);
  fastify.put('/update', { preHandler: [RolesMiddleware.updateRole, checkPermission('Roles', 'UPDATE')] }, RolesController.updateRole);
  fastify.delete('/delete/:role_id', { preHandler: [RolesMiddleware.deleteRole, checkPermission('Roles', 'DELETE')] }, RolesController.deleteRole);
}