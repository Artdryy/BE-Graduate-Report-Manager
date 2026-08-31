// SQLSTATE que usan los procedimientos almacenados con `signal` para reportar
// una violacion de regla de negocio (por ejemplo "Semester already exists").
const SQLSTATE_REGLA_NEGOCIO = '45000';

/**
 * El driver de MariaDB antepone "(conn:N, no:1644, SQLState: 45000) " al
 * mensaje y le añade "\nsql: CALL ...". Devolver eso tal cual filtraria la
 * consulta y los nombres de los procedimientos al cliente.
 */
function mensajeDeProcedimiento(errorOriginal, mensajeCompleto) {
  if (errorOriginal?.text) return errorOriginal.text;

  return (mensajeCompleto || '')
    .replace(/^\(conn:[^)]*\)\s*/, '')
    .split('\nsql:')[0]
    .trim();
}

function handleNotFound(request, reply) {
  const message = 'Ruta no encontrada'
  request.log.warn(message)

  reply.status(404).send({
    status: false,
    message,
    data: null,
  })
}

function handleError(error, request, reply) {
  // El error completo siempre va al log del servidor.
  request.log.error(error)

  const original = error.original || error.parent;

  // Regla de negocio lanzada desde un procedimiento almacenado -> 400
  if (original && String(original.sqlState) === SQLSTATE_REGLA_NEGOCIO) {
    return reply.status(400).send({
      status: false,
      message: mensajeDeProcedimiento(original, error.message),
      data: null,
    });
  }

  // Error de validacion de Joi -> 400 (antes caia en el 500 generico)
  if (error.isJoi) {
    return reply.status(400).send({
      status: false,
      message: error.message,
      data: null,
    });
  }

  const statusCode = error.statusCode || 500

  // Para errores inesperados no se devuelve el mensaje interno: puede contener
  // SQL, rutas de archivos o detalles del esquema.
  const message = statusCode >= 500
    ? 'Error interno del servidor'
    : (error.message || 'Error en la petición')

  reply.status(statusCode).send({
    status: false,
    message,
    data: null,
  })
}

export { handleError, handleNotFound }
