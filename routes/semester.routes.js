import SemesterController from '../controllers/semester.controller.js';
import SemesterMiddleware from '../middlewares/semester.middleware.js';
import { checkPermission } from '../middlewares/authorization.middleware.js';

export default async function semesterRoutes(fastify) {
  fastify.post('/create', { preHandler: [SemesterMiddleware.createSemester, checkPermission('Reports', 'CREATE')] }, SemesterController.createSemester);
  fastify.get('/list', { compress: false, preHandler: [SemesterMiddleware.getSemesters, checkPermission('Reports', 'READ')] }, SemesterController.getSemesters);
  fastify.put('/update', { preHandler: [SemesterMiddleware.updateSemester, checkPermission('Reports', 'UPDATE')] }, SemesterController.updateSemester);
  fastify.delete('/delete/:semester_id', { preHandler: [SemesterMiddleware.deleteSemester, checkPermission('Reports', 'DELETE')] }, SemesterController.deleteSemester);
}