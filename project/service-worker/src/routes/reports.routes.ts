import { Router, Request, Response } from "express";
import { HealthCheckController } from "@/controllers/health-check.controller";
import { KafkaConsumer } from "@/providers/broker/consumer";

export function createReportsRouter(kafkaConsumer: KafkaConsumer) {
  const router = Router();
  
  router.get('/broker/health-check', (req, res) => {
    const healthCheckController = new HealthCheckController(kafkaConsumer);
    healthCheckController.execute(req, res);
  });

  return router;
}