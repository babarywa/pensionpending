import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateSubscriptionBody, DeleteSubscriptionParams } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/", requireAuth, async (req: any, res) => {
  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.userId));
  return res.json(subs);
});

router.post("/", requireAuth, async (req: any, res) => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();

  return res.status(201).json(sub);
});

router.delete("/:subscriptionId", requireAuth, async (req: any, res) => {
  const parsed = DeleteSubscriptionParams.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const deleted = await db
    .delete(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.id, parsed.data.subscriptionId),
        eq(subscriptionsTable.userId, req.userId)
      )
    )
    .returning();

  if (!deleted.length) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
});

export default router;
