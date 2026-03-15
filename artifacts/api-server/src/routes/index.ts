import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import sitesRouter from "./sites";
import energyRouter from "./energy";
import lifemeshRouter from "./lifemesh";
import earthshieldRouter from "./earthshield";
import alertsRouter from "./alerts";
import usersRouter from "./users";
import commandCenterRouter from "./command-center";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(sitesRouter);
router.use(energyRouter);
router.use(lifemeshRouter);
router.use(earthshieldRouter);
router.use(alertsRouter);
router.use(usersRouter);
router.use(commandCenterRouter);

export default router;
