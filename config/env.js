import { envValues } from './envSchema.js'

const envConfig = {
    database: {
        name: envValues.DATABASE_NAME,
        user: envValues.DATABASE_USER,
        password: envValues.DATABASE_PASSWORD,
        host: envValues.DATABASE_HOST,
        port: envValues.DATABASE_PORT,
    },
    global: {
        port: envValues.PORT,
        apiKey: envValues.API_KEY,
        corsOrigin: envValues.CORS_ORIGIN,
    },
    bootstrap: {
        enabled: envValues.BOOTSTRAP_ENABLED,
        superUser: envValues.SUPERUSER_USER,
        superEmail: envValues.SUPERUSER_EMAIL,
        superPassword: envValues.SUPERUSER_PASSWORD,
        superRoleName: envValues.SUPERUSER_ROLE_NAME,
    },
}

export const globalConfig = envConfig.global;

export const bootstrapConfig = envConfig.bootstrap;

export { envConfig };
