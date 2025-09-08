import { Router, Request, Response } from "express";
import { HealthCheckController } from "@/controllers/health-check.controller";
import { KafkaConsumer } from "@/providers/broker/kafka.consumer";

export function createReportsRouter() {
  const kafkaConsumer = new KafkaConsumer()
  const router = Router();
  
  router.get('/broker/health-check', (req: Request, res: Response) => {
    const healthCheckController = new HealthCheckController(kafkaConsumer);
    healthCheckController.execute(req, res);
  });

  return router;
}