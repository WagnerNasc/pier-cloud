import { Request, Response } from "express";
import { ReportExportService } from "@/services/report-export.service";

export class ReportExportController {
  async handle(_req: Request, res: Response) {
    try {
      const reportExportService = new ReportExportService();
      const report = await reportExportService.exportReport();

      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: 'Report export failed.' });
    }
  }
}

