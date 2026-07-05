import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import moderationRouter from "./moderation";
import adminRouter from "./admin";
import reflectionsRouter from "./reflections";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(moderationRouter);
router.use(adminRouter);
router.use(reflectionsRouter);

export default router;
