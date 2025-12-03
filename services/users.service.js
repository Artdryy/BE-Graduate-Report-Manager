import UsersRepository from '../repositories/users.repository.js';
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

    const accessTokenPayload = { userId: user.id, roleId: user.role_id };
    const accessToken = jwt.sign(accessTokenPayload, envValues.JWT_SECRET, {
      expiresIn: envValues.ACCESS_TOKEN_EXPIRATION 
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + envValues.REFRESH_TOKEN_EXPIRATION_DAYS);

    await UsersRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async refreshToken(token) {
    const user = await UsersRepository.findUserByRefreshToken(token);
    if (!user) {
      throw new HttpError('Sesión inválida o expirada', 403);
    }

    const accessTokenPayload = { userId: user.id, roleId: user.role_id };
    const newAccessToken = jwt.sign(accessTokenPayload, envValues.JWT_SECRET, {
      expiresIn: envValues.ACCESS_TOKEN_EXPIRATION
    });

    return { accessToken: newAccessToken };
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