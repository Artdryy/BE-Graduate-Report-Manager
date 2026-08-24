import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import { bootstrapConfig } from '../config/env.js';
import BootstrapRepository from '../repositories/bootstrap.repository.js';
import { currentYearSemesters } from '../utils/semesters.js';

/**
 * Catalogo base de autorizacion.
 *
 * Estas cadenas son criticas y deben coincidir exactamente:
 *  - `check_role_permission` compara `p.permission = p_permission_name` contra
 *    los literales de `checkPermission('Reports', 'CREATE')` en routes/*.routes.js
 *  - el frontend indexa los modulos por `module_name` en Sidebar.jsx y AppRouter.jsx
 */
const MODULOS = ['Reports', 'Users', 'Companies', 'Roles'];
const PERMISOS = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

const SALT_ROUNDS = 10; // igual que repositories/users.repository.js

const log = (mensaje) => console.log(`[bootstrap] ${mensaje}`);

class BootstrapService {
  /**
   * Deja la base de datos lista para usarse: catalogo de modulos y permisos,
   * rol de superusuario con todos los permisos, superusuario y los semestres
   * del año en curso.
   *
   * Es idempotente: se ejecuta en cada arranque y no duplica registros ni
   * sobrescribe la contraseña de un superusuario que ya exista.
   */
  async runBootstrap() {
    const { superUser, superEmail, superPassword, superRoleName } = bootstrapConfig;

    await sequelize.transaction(async (transaction) => {
      // 1. Catalogo de modulos y permisos
      await BootstrapRepository.ensureModules(MODULOS, transaction);
      await BootstrapRepository.ensurePermissions(PERMISOS, transaction);
      log(`catálogo verificado: ${MODULOS.length} módulos, ${PERMISOS.length} permisos`);

      // 2. Rol de superusuario con el producto cruzado completo de permisos
      const roleId = await BootstrapRepository.ensureRole(
        {
          role_name: superRoleName,
          description: 'Rol con acceso total. Creado automáticamente al inicializar el sistema.',
        },
        transaction
      );

      if (!roleId) {
        throw new Error(`No se pudo crear ni localizar el rol "${superRoleName}"`);
      }

      await BootstrapRepository.grantAllToRole(roleId, transaction);
      log(`rol "${superRoleName}" (id ${roleId}) con todos los permisos concedidos`);

      // 3. Superusuario
      const existente = await BootstrapRepository.findUserByName(superUser, transaction);

      if (existente) {
        log(`el usuario "${superUser}" ya existe (id ${existente.id}); no se modifica su contraseña`);
      } else {
        const hash = await bcrypt.hash(superPassword, SALT_ROUNDS);
        const creado = await BootstrapRepository.insertUser(
          { user_name: superUser, password: hash, email: superEmail, role_id: roleId },
          transaction
        );
        log(`superusuario "${superUser}" creado (id ${creado?.id})`);
      }

      // 4. Semestres del año en curso
      const etiquetas = currentYearSemesters();
      const creados = await BootstrapRepository.ensureSemesters(etiquetas, transaction);

      if (creados.length) {
        log(`semestres creados: ${creados.join(', ')}`);
      } else {
        log(`semestres del año en curso ya presentes: ${etiquetas.join(', ')}`);
      }
    });

    log('inicialización completada.');
  }
}

export default new BootstrapService();
