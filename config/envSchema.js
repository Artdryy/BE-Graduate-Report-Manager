import dotenv from 'dotenv'
import dotenvexpand from 'dotenv-expand'
import Joi from 'joi'

const env = dotenv.config()
dotenvexpand.expand(env)

// Valores de ejemplo de .env.example: si siguen presentes el despliegue no es seguro
const PLACEHOLDER_DB_PASSWORD = 'cambiar_contraseña_segura'
const PLACEHOLDER_JWT_SECRET = 'cambiar_secreto_jwt_seguro'
const PLACEHOLDER_SUPERUSER_PASSWORD = 'cambiar_password_superusuario'

const envSchema = Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required().invalid(PLACEHOLDER_DB_PASSWORD),
    DATABASE_PORT: Joi.number().default(3306),
    // allow('') porque docker-compose pasa API_KEY vacia cuando no se define
    API_KEY: Joi.string().allow('').optional(),
    JWT_SECRET: Joi.string().min(32).required().invalid(PLACEHOLDER_JWT_SECRET),
    ACCESS_TOKEN_EXPIRATION: Joi.string().default('90m'),
    REFRESH_TOKEN_EXPIRATION_DAYS: Joi.number().default(7),

    // Origenes permitidos para CORS, separados por coma.
    // Vacio = solo mismo origen (correcto detras del proxy de nginx).
    CORS_ORIGIN: Joi.string().allow('').default(''),

    // Inicializacion automatica de la base de datos
    BOOTSTRAP_ENABLED: Joi.boolean().default(true),
    SUPERUSER_USER: Joi.string().max(100).trim().required(),
    SUPERUSER_EMAIL: Joi.string().email().max(100).required(),
    SUPERUSER_PASSWORD: Joi.string().min(12).max(255).required().invalid(PLACEHOLDER_SUPERUSER_PASSWORD),
    SUPERUSER_ROLE_NAME: Joi.string().max(100).default('Superusuario'),
}).unknown()

const { error, value: envValues} = envSchema.validate(process.env)

if (error) {
    console.error('Error de configuración: ', error.message)
    console.error('Revisa tu archivo .env (usa .env.example como referencia).')
    process.exit(1)
}

export {envValues}
