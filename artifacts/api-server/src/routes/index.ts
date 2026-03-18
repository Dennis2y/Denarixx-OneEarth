import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth.js";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import sitesRouter from "./sites.js";
import energyRouter from "./energy.js";
import lifemeshRouter from "./lifemesh.js";
import earthshieldRouter from "./earthshield.js";
import alertsRouter from "./alerts.js";
import usersRouter from "./users.js";
import commandCenterRouter from "./command-center.js";
import auditRouter from "./audit.js";
import reportsRouter from "./reports.js";
import mapRouter from "./map.js";
import liveRouter from "./live.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(liveRouter);

router.use(requireAuth);

router.use(dashboardRouter);
router.use(sitesRouter);
router.use(energyRouter);
router.use(lifemeshRouter);
router.use(earthshieldRouter);
router.use(alertsRouter);
router.use(usersRouter);
router.use(commandCenterRouter);
router.use(auditRouter);
router.use(reportsRouter);
router.use(mapRouter);

export default router;
