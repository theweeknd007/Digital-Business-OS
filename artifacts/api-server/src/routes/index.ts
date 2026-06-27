import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import salesRouter from "./sales";
import walletRouter from "./wallet";
import withdrawalsRouter from "./withdrawals";
import affiliatesRouter from "./affiliates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(walletRouter);
router.use(withdrawalsRouter);
router.use(affiliatesRouter);

export default router;
