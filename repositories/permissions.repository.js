import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';

class PermissionsRepository {
  async createPermission({ permission }) {
    const result = await sequelize.query(
      'CALL residencias.create_permission(?);',
      {
        replacements: [permission],
        type: QueryTypes.SELECT
      }
    );
    return result[0][0];
  }

  async getPermissions() {
    const result = await sequelize.query(
      'CALL residencias.get_permissions();',
      {
        type: QueryTypes.SELECT
      }
    );
    return result[0];
  }

  async updatePermission({ permission_id, permission }) {
    const result = await sequelize.query(
      'CALL residencias.update_permission(?, ?);',
      {
        replacements: [permission_id, permission],
        type: QueryTypes.SELECT
      }
    );
    return result[0][0];
  }

  async deletePermission({ permission_id }) {
    const result = await sequelize.query(
      'CALL residencias.delete_permission(?);',
      {
        replacements: [permission_id],
        type: QueryTypes.SELECT
      }
    );
    return result[0][0];
  }

  async assignPermissionsToRole({ role_id, permissionsJson }) {
    const result = await sequelize.query(
      'CALL residencias.assign_permissions_to_role(?, ?);',
      {
        replacements: [role_id, permissionsJson],
        type: QueryTypes.SELECT,
      }
    );
    return result[0][0];
  }

  async getPermissionsForRole({ role_id }) {
    const result = await sequelize.query(
      'CALL residencias.get_permissions_for_role(?);',
      {
        replacements: [role_id],
        type: QueryTypes.SELECT,
      }
    );
    return result[0];
  }
}

export default new PermissionsRepository();