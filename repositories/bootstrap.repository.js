import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Consultas de inicializacion de la base de datos.
 *
 * A diferencia del resto de repositorios, aqui no se usan procedimientos
 * almacenados: los procedimientos de creacion (create_role, create_user,
 * create_semester, ...) lanzan `signal sqlstate '45000'` cuando el registro ya
 * existe, asi que fallarian en cada arranque. Se usa DML idempotente
 * (INSERT IGNORE contra las claves unicas ya definidas en .db-tables) para que
 * el arranque se pueda repetir sin efectos secundarios.
 */
class BootstrapRepository {
  async ensureModules(moduleNames, transaction) {
    if (!moduleNames.length) return;
    const placeholders = moduleNames.map(() => '(?)').join(', ');
    await sequelize.query(
      `INSERT IGNORE INTO residencias.modules (module_name) VALUES ${placeholders};`,
      { replacements: moduleNames, type: QueryTypes.INSERT, transaction }
    );
  }

  async ensurePermissions(permissionNames, transaction) {
    if (!permissionNames.length) return;
    const placeholders = permissionNames.map(() => '(?)').join(', ');
    await sequelize.query(
      `INSERT IGNORE INTO residencias.permissions (permission) VALUES ${placeholders};`,
      { replacements: permissionNames, type: QueryTypes.INSERT, transaction }
    );
  }

  async ensureRole({ role_name, description }, transaction) {
    await sequelize.query(
      'INSERT IGNORE INTO residencias.roles (role_name, description) VALUES (?, ?);',
      { replacements: [role_name, description], type: QueryTypes.INSERT, transaction }
    );

    const rows = await sequelize.query(
      'SELECT id FROM residencias.roles WHERE role_name = ? LIMIT 1;',
      { replacements: [role_name], type: QueryTypes.SELECT, transaction }
    );

    return rows[0]?.id ?? null;
  }

  /**
   * Concede al rol todos los modulos y todos los permisos existentes.
   * El producto cruzado completo es intencional: get_permissions_for_role solo
   * devuelve filas ya existentes, asi que un rol sin filas se muestra como una
   * rejilla de permisos vacia en el frontend.
   */
  async grantAllToRole(roleId, transaction) {
    await sequelize.query(
      `INSERT IGNORE INTO residencias.roles_modules (role_id, module_id, is_visible)
         SELECT ?, m.id, 1 FROM residencias.modules m;`,
      { replacements: [roleId], type: QueryTypes.INSERT, transaction }
    );

    await sequelize.query(
      `INSERT IGNORE INTO residencias.roles_modules_permissions (role_id, module_id, permission_id, is_granted)
         SELECT ?, m.id, p.id, 1
         FROM residencias.modules m
         CROSS JOIN residencias.permissions p;`,
      { replacements: [roleId], type: QueryTypes.INSERT, transaction }
    );
  }

  async findUserByName(userName, transaction) {
    const rows = await sequelize.query(
      'SELECT id, user_name, role_id, is_active FROM residencias.users WHERE user_name = ? LIMIT 1;',
      { replacements: [userName], type: QueryTypes.SELECT, transaction }
    );

    return rows[0] ?? null;
  }

  async insertUser({ user_name, password, email, role_id }, transaction) {
    await sequelize.query(
      `INSERT IGNORE INTO residencias.users (user_name, password, email, role_id, is_active)
       VALUES (?, ?, ?, ?, 1);`,
      { replacements: [user_name, password, email, role_id], type: QueryTypes.INSERT, transaction }
    );

    return this.findUserByName(user_name, transaction);
  }

  /**
   * Inserta las etiquetas de semestre que falten. Devuelve las que se crearon
   * realmente, para poder registrarlas en el log.
   */
  async ensureSemesters(labels, transaction) {
    if (!labels.length) return [];

    const existingPlaceholders = labels.map(() => '?').join(', ');
    const before = await sequelize.query(
      `SELECT semester FROM residencias.semester WHERE semester IN (${existingPlaceholders});`,
      { replacements: labels, type: QueryTypes.SELECT, transaction }
    );
    const yaExisten = new Set(before.map((row) => row.semester));
    const faltantes = labels.filter((label) => !yaExisten.has(label));

    if (!faltantes.length) return [];

    const placeholders = faltantes.map(() => '(?)').join(', ');
    await sequelize.query(
      `INSERT IGNORE INTO residencias.semester (semester) VALUES ${placeholders};`,
      { replacements: faltantes, type: QueryTypes.INSERT, transaction }
    );

    return faltantes;
  }
}

export default new BootstrapRepository();
