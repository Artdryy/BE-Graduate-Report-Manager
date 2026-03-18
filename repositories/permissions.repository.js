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
      'CALL residencias.update_role_permissions(?, ?);',
      {
        replacements: [role_id, permissionsJson],
        type: QueryTypes.RAW,
      }
    );
    return result[0]
  }

  async getPermissionsForRole({ role_id }) {
    const result = await sequelize.query(
      'CALL residencias.get_permissions_for_role(?);',
      {
        replacements: [role_id],
        type: QueryTypes.SELECT,
      }
    );
    // Mapear campos para compatibilidad con el frontend
    return Object.values(result[0]).map(row => ({
      ...row,
      permission: row.permission_name,
      is_visible: 1,
      is_granted: 1,
    }));
  }
}

export default new PermissionsRepository();