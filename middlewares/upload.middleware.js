import fs from 'fs';
import path from 'path';

class UploadMiddleware {
  validatePdfUpload = async (req, reply) => {
    if (!req.isMultipart()) {
      return reply.code(400).send({ 
        status: false, 
        message: 'Request must be multipart/form-data', 
        data: null 
      });
    }

    // Asegúrate de que el directorio de uploads existe
    const uploadDir = path.resolve('uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Valida el tipo de archivo en el middleware
    const parts = req.parts();
    for await (const part of parts) {
      if (part.file) {
        if (part.mimetype !== 'application/pdf') {
          return reply.code(400).send({ 
            status: false, 
            message: 'Only PDF files are allowed', 
            data: null 
          });
        }
        // Devuelve el stream al request para que el controlador lo procese
        req.rawFile = part;
        break;
      }
    }
  }
}

export default new UploadMiddleware();