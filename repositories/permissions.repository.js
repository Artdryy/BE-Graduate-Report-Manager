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
    // El procedimiento real es assign_permissions_to_role. update_role_permissions
    // no existe: la llamada fallaba siempre, asi que guardar permisos desde la
    // interfaz nunca funciono.
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
    // El procedimiento ya devuelve permission, is_granted e is_visible con sus
    // valores reales. Antes habia que fabricarlos aqui porque solo devolvia
    // permission_name, pero fijarlos a 1 concedia de hecho todos los permisos
    // y todos los modulos a cualquier rol que tuviera una sola fila.
    return Object.values(result[0]);
  }
}

export default new PermissionsRepository();