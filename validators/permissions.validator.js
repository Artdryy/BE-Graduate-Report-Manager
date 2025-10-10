import Joi from 'joi';

class PermissionsValidator {
  createPermission() {
    return Joi.object({
      permission: Joi.string().max(50).trim().required(),
    });
  }

  getPermissions() {
    return Joi.object({});
  }

  updatePermission() {
    return Joi.object({
      permission_id: Joi.number().required(),
      permission: Joi.string().max(50).trim().required(),
    });
  }

  deletePermission() {
    return Joi.object({
      permission_id: Joi.number().required(),
    });
  }

  assignPermissions() {
    return Joi.object({
      role_id: Joi.number().required(),
      permissions: Joi.array().items(
        Joi.object({
          module_id: Joi.number().required(),
          permission_id: Joi.number().required(),
        })
      ).min(1).required(),
    });
  }

  getPermissionsForRole() {
    return Joi.object({
      role_id: Joi.number().required(),
    });
  }
}

export default new PermissionsValidator();