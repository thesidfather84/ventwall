import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import postsRouter from "./posts.js";
import moderationRouter from "./moderation.js";
import adminRouter from "./admin.js";
import reflectionsRouter from "./reflections.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(moderationRouter);
router.use(adminRouter);
router.use(reflectionsRouter);

export default router;
