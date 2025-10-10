import KeywordsController from '../controllers/keywords.controller.js';
import KeywordsMiddleware from '../middlewares/keywords.middleware.js';
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function keywordsRoutes(fastify) {
  fastify.post('/create', { preHandler: [KeywordsMiddleware.createKeyword, checkPermission('Reports', 'CREATE')] }, KeywordsController.createKeyword);
  fastify.get('/list', { preHandler: [KeywordsMiddleware.getKeywords, checkPermission('Reports', 'READ')] }, KeywordsController.getKeywords);
  fastify.put('/update', { preHandler: [KeywordsMiddleware.updateKeyword, checkPermission('Reports', 'UPDATE')] }, KeywordsController.updateKeyword);
  fastify.delete('/delete/:keyword_id', { preHandler: [KeywordsMiddleware.deleteKeyword, checkPermission('Reports', 'DELETE')] }, KeywordsController.deleteKeyword);
}