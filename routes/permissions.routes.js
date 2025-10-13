import PermissionsController from '../controllers/permissions.controller.js';
import PermissionsMiddleware from '../middlewares/permissions.middleware.js';
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function permissionsRoutes(fastify) {
  fastify.post('/create', { preHandler: [PermissionsMiddleware.createPermission, checkPermission('Roles', 'CREATE')] }, PermissionsController.createPermission);
  fastify.get('/list', { compress: false, preHandler: [PermissionsMiddleware.getPermissions, checkPermission('Roles', 'READ')] }, PermissionsController.getPermissions);
  fastify.put('/update', { preHandler: [PermissionsMiddleware.updatePermission, checkPermission('Roles', 'UPDATE')] }, PermissionsController.updatePermission);
  fastify.delete('/delete/:permission_id', { preHandler: [PermissionsMiddleware.deletePermission, checkPermission('Roles', 'DELETE')] }, PermissionsController.deletePermission);

  fastify.get('/role/:role_id', { compress: false, preHandler: [PermissionsMiddleware.getPermissionsForRole, checkPermission('Roles', 'READ')] }, PermissionsController.getPermissionsForRole);

  fastify.post('/assign-to-role', { preHandler: [PermissionsMiddleware.assignPermissions, checkPermission('Roles', 'UPDATE')] }, PermissionsController.assignPermissionsToRole);
}