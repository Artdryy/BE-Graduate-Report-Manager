import ReportsService from '../services/reports.service.js';
import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';

class ReportsController {
  createReport = async (req, reply) => {
    if (!req.isMultipart()) {
      return reply.status(400).send({ status: false, message: 'Request must be multipart/form-data', data: null });
    }

    const parts = await req.parts();
    const data = {};
    let pdf_route = null;

    try {
      for await (const part of parts) {
        if (part.file) {
          const uniqueFilename = `${Date.now()}-${part.filename}`;
          const uploadDir = path.resolve('uploads', 'reports');
          pdf_route = path.join(uploadDir, uniqueFilename);
          await fs.mkdir(uploadDir, { recursive: true });
          const writeStream = createWriteStream(pdf_route);
          try {
            await pipeline(part.file, writeStream);
          } catch (error) {
            writeStream.destroy();
            await fs.unlink(pdf_route).catch(() => {});
            throw error;
          }
        } else {
          data[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      console.error('Failed to process multipart form:', error);
      
      if (pdf_route) {
        try {
          await fs.unlink(pdf_route).catch(() => {});
        } catch (unlinkError) {
          console.error('Failed to clean up file after error:', unlinkError);
        }
      }
      
      return reply.status(500).send({ 
        status: false, 
        message: `Error processing file upload: ${error.message}`, 
        data: null 
      });
    }

    if (!pdf_route) {
      return reply.status(400).send({ status: false, message: 'PDF file is required.', data: null });
    }

    try {
      const reportData = {
        ...data,
        company_id: parseInt(data.company_id, 10),
        semester_id: parseInt(data.semester_id, 10),
        keywords: JSON.parse(data.keywords || '[]'),
        pdf_route
      };
      const result = await ReportsService.createReport(reportData);
      reply.code(201).send({ status: true, message: 'Report created successfully', data: result });
    } catch (error) {      
      try {
        await fs.unlink(pdf_route);
      } catch (unlinkError) {
    }
      reply.status(500).send({ 
        status: false, 
        message: 'Error creating report', 
        error: error.message,
        data: null 
      });
    }
  };

  getReports = async (req, reply) => {
    const result = await ReportsService.getReports();
    reply.sendSuccess({ message: 'Reports fetched successfully', data: result });
  };

  updateReport = async (req, reply) => {
    const { report_id } = req.params;
    const data = { report_id: parseInt(report_id, 10) };
    let pdf_route = undefined;

    try {
      if (!req.isMultipart()) {
        return reply.status(400).send({ status: false, message: 'Request must be multipart/form-data', data: null });
      }

      const parts = await req.parts();
      for await (const part of parts) {
        if (part.file) {
          const uniqueFilename = `${Date.now()}-${part.filename}`;
          const uploadDir = path.resolve('uploads', 'reports');
          pdf_route = path.join(uploadDir, uniqueFilename);

          await fs.mkdir(uploadDir, { recursive: true });

          const writeStream = createWriteStream(pdf_route);
          
          try {
            await pipeline(part.file, writeStream);
          } catch (error) {
            writeStream.destroy();
            await fs.unlink(pdf_route).catch(() => {});
            throw error;
          }
        } else {
          data[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      console.error('Failed to process multipart form:', error);
      
      if (pdf_route) {
        try {
          await fs.unlink(pdf_route).catch(() => {});
        } catch (unlinkError) {
          console.error('Failed to clean up file after error:', unlinkError);
        }
      }
      
      return reply.status(500).send({ 
        status: false, 
        message: `Error processing file upload: ${error.message}`, 
        data: null 
      });
    }

    const updateData = {
      ...data,
      company_id: parseInt(data.company_id, 10),
      semester_id: parseInt(data.semester_id, 10),
      keywords: JSON.parse(data.keywords || '[]'),
      ...(pdf_route && { pdf_route })
    };
    
    const result = await ReportsService.updateReport(updateData);
    reply.sendSuccess({ message: 'Report updated successfully', data: result });
  };

  deleteReport = async (req, reply) => {
    const { report_id } = req.params;
    const result = await ReportsService.deleteReport({ report_id: parseInt(report_id, 10) });
    reply.sendSuccess({ message: result.message || 'Report deleted successfully', data: null });
  };

  getReportsByKeyword = async (req, reply) => {
      const { keyword } = req.params;
      const result = await ReportsService.getReportsByKeyword({ keyword });
      reply.sendSuccess({ message: `Reports fetched for keyword: ${keyword}`, data: result });
  }
}

export default new ReportsController();