import ReportsService from '../services/reports.service.js';
import { pipeline } from 'node:stream/promises';
import { promises as fs } from 'node:fs';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import ReportsValidator from '../validators/reports.validator.js';

class ReportsController {
  createReport = async (req, reply) => {
    if (!req.isMultipart()) {
      return reply.status(400).send({ message: 'Request must be multipart/form-data' });
    }

    const parts = await req.parts();
    const data = {};
    let pdf_route = null;

    try {
      for await (const part of parts) {
        if (part.file) {
          const uniqueFilename = `${Date.now()}-${part.filename}`;
          const uploadDir = path.resolve('uploads', 'reports');
          const physicalPath = path.join(uploadDir, uniqueFilename);
          pdf_route = path.join('reports', uniqueFilename).replace(/\\/g, '/');
          
          await fs.mkdir(uploadDir, { recursive: true });
          await pipeline(part.file, createWriteStream(physicalPath));
        } else {
          data[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      console.error('Failed to process multipart form:', error);
      return reply.status(500).send({ message: `Error processing file upload: ${error.message}` });
    }

    if (!pdf_route) {
      return reply.status(400).send({ message: 'PDF file is required.' });
    }

    try {
      const reportData = {
        ...data,
        company_id: parseInt(data.company_id, 10),
        semester_id: parseInt(data.semester_id, 10),
        keywords: JSON.parse(data.keywords || '[]'),
        work_area: data.work_area || null,
        pdf_route
      };
      const result = await ReportsService.createReport(reportData);
      reply.code(201).send({ status: true, message: 'Report created successfully', data: result });
    } catch (error) {
      reply.status(500).send({ message: 'Error creating report', error: error.message });
    }
  };

  getReports = async (req, reply) => {
    const result = await ReportsService.getReports();
    reply.send({ status: true, message: 'Reports fetched successfully', data: result });
  };

updateReport = async (req, reply) => {
    const { report_id } = req.params;
    const data = {};
    let pdf_route = undefined;

    try {
      if (!req.isMultipart()) {
        return reply.status(400).send({ message: 'Request must be multipart/form-data' });
      }

      const parts = await req.parts();
      for await (const part of parts) {
        if (part.file) {
          const uniqueFilename = `${Date.now()}-${part.filename}`;
          const uploadDir = path.resolve('uploads', 'reports');
          const physicalPath = path.join(uploadDir, uniqueFilename);
          pdf_route = path.join('reports', uniqueFilename).replace(/\\/g, '/');
          
          await fs.mkdir(uploadDir, { recursive: true });
          await pipeline(part.file, createWriteStream(physicalPath));
        } else {
          data[part.fieldname] = part.value;
        }
      }
    } catch (error) {
      console.error('Failed to process multipart form during update:', error);
      return reply.status(500).send({ message: `Error processing file upload: ${error.message}` });
    }

    const { error: validationError } = ReportsValidator.updateReport().validate(data);
    if (validationError) {
      return reply.code(400).send({
        status: false,
        message: validationError.details[0].message,
        data: null,
      });
    }

    const updateData = {
      ...data,
      report_id: parseInt(report_id, 10),
      company_id: parseInt(data.company_id, 10),
      semester_id: parseInt(data.semester_id, 10),
      keywords: data.keywords, 
      work_area: data.work_area || null,
      pdf_route: pdf_route || null, 
    };
    
    const result = await ReportsService.updateReport(updateData);
    reply.send({ status: true, message: 'Report updated successfully', data: result });
  };

  deleteReport = async (req, reply) => {
    const { report_id } = req.params;
    const result = await ReportsService.deleteReport({ report_id: parseInt(report_id, 10) });
    reply.send({ status: true, message: result.message || 'Report deleted successfully', data: null });
  };

  getReportsByKeyword = async (req, reply) => {
    const { keyword } = req.params;
    const result = await ReportsService.getReportsByKeyword({ keyword });
    reply.send({ status: true, message: `Reports fetched for keyword: ${keyword}`, data: result });
  };
}

export default new ReportsController();