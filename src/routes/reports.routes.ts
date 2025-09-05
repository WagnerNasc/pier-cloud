import { Router, Request, Response } from "express";
import { ReportExportController } from "@/controllers/report-export.controller";

const router = Router();

const reportExportController = new ReportExportController();
router.get('/api/reports/sales-by-seller', (_req: Request, res: Response) => reportExportController.handle(_req, res));

export { router };