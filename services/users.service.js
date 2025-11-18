import UsersRepository from '../repositories/users.repository.js';
import PermissionsRepository from '../repositories/permissions.repository.js'; 
import { catchError } from '../helpers/catch.error.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { envValues } from '../config/envSchema.js';
import EmailService from './email.service.js';

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class UsersService {
  async createUser(data) {
    const [result, error] = await catchError(UsersRepository.createUser(data));
    if (error) throw error;
    return result;
  }

  async getUsers() {
    const [result, error] = await catchError(UsersRepository.getUsers());
    if (error) throw error;
    return result;
  }

  async updateUser(data) {
    const [result, error] = await catchError(UsersRepository.updateUser(data));
    if (error) throw error;
    return result;
  }

  async deleteUser(data) {
    const [result, error] = await catchError(UsersRepository.deleteUser(data));
    if (error) throw error;
    return result;
  }

  async requestPasswordReset(email) {
    const user = await UsersRepository.findUserByEmail({ email });
    if (user) {
      const [result, error] = await catchError(UsersRepository.generateCode({ user_id: user.id }));
      if (error) throw error;
      await EmailService.sendPasswordResetEmail(email, result.code);
    }
  }
  
  async resetPassword({ email, code, newPassword }) {
    const user = await UsersRepository.findUserByEmail({ email });

    if (!user) {
      throw new HttpError('El código de recuperación es inválido o ha expirado.', 400);
    }
    if (user.code !== code) {
      throw new HttpError('El código de recuperación es inválido o ha expirado.', 400);
    }

    const [result, error] = await catchError(UsersRepository.changePassword({
      user_id: user.id,
      new_password: newPassword,
      code: code
    }));
    if (error) throw error;
    return result;
  }

  async loginUser({ user_name, password }) {
    const user = await UsersRepository.findUserByName({ user_name });
    if (!user) {
      throw new HttpError('Credenciales inválidas', 401);
    }

    if (user.is_active === 0) {
      throw new HttpError('Usuario inactivo. Contacte al administrador.', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpError('Credenciales inválidas', 401);
    }

    // --- Step 1: Get the complex data structure from the repository ---
    const rawPermissionsResult = await PermissionsRepository.getPermissionsForRole({ role_id: user.role_id });

    let permissions = []; // Default to an empty array

    // --- Step 2: ✅ DEFINITIVE FIX - Handle the exact structure from your logs ---
    // This checks for the structure: [ { "0": p1, "1": p2, ... } ]
    if (Array.isArray(rawPermissionsResult) && rawPermissionsResult.length > 0 && typeof rawPermissionsResult[0] === 'object' && rawPermissionsResult[0] !== null) {
      // This is the object that contains {"0": p1, "1": p2, ...}
      const permissionsObject = rawPermissionsResult[0];
      
      // Object.values() correctly extracts [p1, p2, ...] into a proper array.
      permissions = Object.values(permissionsObject);
    } else {
        console.warn('WARNING: Permissions data from repository was not in the expected format. User will have no permissions for this session.');
    }

    // --- Step 3: Continue with login ---
    const accessTokenPayload = { userId: user.id, roleId: user.role_id };
    const accessToken = jwt.sign(accessTokenPayload, envValues.JWT_SECRET, {
      expiresIn: envValues.ACCESS_TOKEN_EXPIRATION 
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + envValues.REFRESH_TOKEN_EXPIRATION_DAYS);

    await UsersRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    // Return the final, clean data object
    return { accessToken, refreshToken, permissions };
  }

  async logoutUser(token) {
    if (!token) {
      throw new HttpError('Refresh token es requerido', 400);
    }
    const success = await UsersRepository.deleteRefreshToken(token);
    if (!success) {
      console.log(`Intento de logout con token no encontrado: ${token}`);
    }
    return { message: 'Logout exitoso' };
  }
}

export default new UsersService();