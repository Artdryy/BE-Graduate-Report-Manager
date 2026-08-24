import 'dotenv/config';
import createServer from './config/server.js';
import { globalConfig, bootstrapConfig } from './config/env.js';
import { authenticate } from './config/database.js';
import BootstrapService from './services/bootstrap.service.js';

const PORT = globalConfig.port;
const HOST = '0.0.0.0';

async function start() {
  try {
    await authenticate();

    // La inicializacion corre antes de escuchar: si falla preferimos no
    // levantar una API a medio inicializar.
    if (bootstrapConfig.enabled) {
      await BootstrapService.runBootstrap();
    } else {
      console.log('[bootstrap] deshabilitado (BOOTSTRAP_ENABLED=false)');
    }

    const app = createServer;
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
