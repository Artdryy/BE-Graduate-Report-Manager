import ModulesController from '../controllers/modules.controller.js';
import ModulesMiddleware from '../middlewares/modules.middleware.js';
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function modulesRoutes(fastify) {
  fastify.post('/create', { preHandler: [ModulesMiddleware.createModule, checkPermission('Roles', 'CREATE')] }, ModulesController.createModule);
  fastify.get('/list', { preHandler: [ModulesMiddleware.getModules, checkPermission('Roles', 'READ')] }, ModulesController.getModules);
  fastify.put('/update', { preHandler: [ModulesMiddleware.updateModule, checkPermission('Roles', 'UPDATE')] }, ModulesController.updateModule);
  fastify.delete('/delete/:module_id', { preHandler: [ModulesMiddleware.deleteModule, checkPermission('Roles', 'DELETE')] }, ModulesController.deleteModule);
}