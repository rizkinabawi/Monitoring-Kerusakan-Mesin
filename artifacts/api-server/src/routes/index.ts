import { Router, type IRouter } from "express";
import machineMonitoringRouter from "./machine-monitoring";

const router: IRouter = Router();

router.use(machineMonitoringRouter);

export default router;
