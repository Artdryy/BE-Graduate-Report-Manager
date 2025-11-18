import UsersService from '../services/users.service.js';

class UsersController {
  createUser = async (req, reply) => {
    const { user_name, password, email, role_id, is_active, code } = req.body;
    const result = await UsersService.createUser({ user_name, password, email, role_id, is_active, code });
    reply.code(201).sendSuccess({ message: 'User created', data: result });
  };

  getUsers = async (req, reply) => {
    const result = await UsersService.getUsers();
    reply.sendSuccess({ message: 'Users fetched', data: result });
  };

  updateUser = async (req, reply) => {
    const { user_id, user_name, email, role_id, is_active } = req.body;
    const result = await UsersService.updateUser({ user_id, user_name, email, role_id, is_active });
    reply.sendSuccess({ message: 'User updated', data: result });
  };

  deleteUser = async (req, reply) => {
    const { user_id } = req.params;
    const result = await UsersService.deleteUser({ user_id });
    reply.sendSuccess({ message: result.message || 'User deleted', data: null });
  };

  requestPasswordReset = async (req, reply) => {
    const { email } = req.body;
    await UsersService.requestPasswordReset(email);
    reply.sendSuccess({ message: 'Si el correo existe en nuestro sistema, se ha enviado un código de recuperación.' });
  };

  resetPassword = async (req, reply) => {
    const { email, code, newPassword } = req.body;
    const result = await UsersService.resetPassword({ email, code, newPassword });
    reply.sendSuccess({ message: result.message || 'Contraseña actualizada correctamente.' });
  };
  loginUser = async (req, reply) => {
    const { user_name, password } = req.body;
    const tokens = await UsersService.loginUser({ user_name, password });
    reply.sendSuccess({ message: 'Login successful', data: tokens });
  };

  refreshToken = async (req, reply) => {
    const { refreshToken } = req.body;
    const newTokens = await UsersService.refreshToken(refreshToken);
    reply.sendSuccess({ message: 'Token refreshed', data: newTokens });
  };

  logout = async (req, reply) => {
    const { refreshToken } = req.body;
    await UsersService.logoutUser(refreshToken);
    reply.sendSuccess({ message: 'Logout successful' });
  };
}

export default new UsersController();