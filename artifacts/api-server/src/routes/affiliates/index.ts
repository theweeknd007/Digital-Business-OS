import { Router, type IRouter } from "express";
import { db, affiliatesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListAffiliatesResponse, GetAffiliateStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function mapAffiliate(a: typeof affiliatesTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    commissionRate: parseFloat(a.commissionRate),
    totalSales: a.totalSales,
    totalCommission: parseFloat(a.totalCommission),
    pendingCommission: parseFloat(a.pendingCommission),
    status: a.status,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
  };
}

router.get("/affiliates", async (_req, res): Promise<void> => {
  const affiliates = await db.select().from(affiliatesTable).orderBy(desc(affiliatesTable.totalCommission));
  res.json(ListAffiliatesResponse.parse(affiliates.map(mapAffiliate)));
});

router.get("/affiliates/stats", async (_req, res): Promise<void> => {
  const affiliates = await db.select().from(affiliatesTable);
  const active = affiliates.filter((a) => a.status === "active");
  const paid = affiliates.reduce((acc, a) => acc + parseFloat(a.totalCommission), 0);
  const totalSales = affiliates.reduce((acc, a) => acc + a.totalSales, 0);
  const top = [...affiliates].sort((a, b) => parseFloat(b.totalCommission) - parseFloat(a.totalCommission))[0];

  res.json(GetAffiliateStatsResponse.parse({
    totalAffiliates: affiliates.length,
    activeAffiliates: active.length,
    totalCommissionPaid: paid,
    totalSalesGenerated: totalSales,
    topAffiliateName: top?.name ?? "—",
    topAffiliateRevenue: top ? parseFloat(top.totalCommission) : 0,
  }));
});

export default router;
