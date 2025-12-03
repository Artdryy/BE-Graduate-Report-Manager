import PermissionsService from '../services/permissions.service.js';

class PermissionsController {
  createPermission = async (req, reply) => {
    const { permission } = req.body;
    const result = await PermissionsService.createPermission({ permission });
    reply.code(201).sendSuccess({ message: 'Permission created', data: result });
  };

  getPermissions = async (req, reply) => {
    const result = await PermissionsService.getPermissions();
    reply.sendSuccess({ message: 'Permissions fetched', data: result });
  };

  updatePermission = async (req, reply) => {
    const { permission_id, permission } = req.body;
    const result = await PermissionsService.updatePermission({ permission_id, permission });
    reply.sendSuccess({ message: 'Permission updated', data: result });
  };

  deletePermission = async (req, reply) => {
    const { permission_id } = req.params;
    const result = await PermissionsService.deletePermission({ permission_id });
    reply.sendSuccess({ message: result.message || 'Permission deleted', data: null });
  };
  
  assignPermissionsToRole = async (req, reply) => {
    const { role_id, permissions } = req.body;
    const result = await PermissionsService.assignPermissionsToRole({ role_id, permissions });
    reply.sendSuccess({ message: result.message, data: null });
  };

  getPermissionsForRole = async (req, reply) => {
    const { role_id } = req.params;
    const result = await PermissionsService.getPermissionsForRole({ role_id });
    reply.sendSuccess({ message: 'Permissions for role fetched successfully', data: result });
  };

  getMyPermissions = async (req, reply) => {
    const { roleId } = req.user; 
    const result = await PermissionsService.getPermissionsForRole({ role_id: roleId });
    reply.sendSuccess({ message: 'My permissions fetched successfully', data: result });
  };
}

export default new PermissionsController();