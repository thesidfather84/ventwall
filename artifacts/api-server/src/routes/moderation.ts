import { Router, type IRouter } from "express";
import { CheckContentBody } from "@workspace/api-zod";
import { checkContent } from "../lib/moderationEngine";

const router: IRouter = Router();

// POST /moderation/check — pre-flight content check before posting
router.post("/moderation/check", async (req, res): Promise<void> => {
  const parsed = CheckContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = checkContent(parsed.data.content);

  res.json({
    flagType: result.flagType,
    severity: result.severity,
    allowed: result.allowed,
    message: result.message,
  });
});

export default router;
