import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import salesRouter from "./sales";
import walletRouter from "./wallet";
import withdrawalsRouter from "./withdrawals";
import affiliatesRouter from "./affiliates";
import adminRouter from "./admin";
import storageRouter from "./storage";
import whopRouter from "./whop";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);

// Protected routes — require valid JWT cookie
router.use(requireAuth);
router.use(storageRouter);
router.use(whopRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(walletRouter);
router.use(withdrawalsRouter);
router.use(affiliatesRouter);
router.use(adminRouter);

export default router;
