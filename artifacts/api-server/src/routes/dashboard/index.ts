import { Router, type IRouter } from "express";
import { db, salesTable, productsTable, transactionsTable } from "@workspace/db";
import { desc, sql, eq, gte } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetRevenueChartResponse,
  GetTrafficSourcesResponse,
  GetTopProductsResponse,
  GetWalletSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const allSales = await db.select().from(salesTable);
  const completedSales = allSales.filter((s) => s.status === "completed");

  const thisMonth = completedSales.filter((s) => new Date(s.createdAt) >= thisMonthStart);
  const lastMonth = completedSales.filter((s) => new Date(s.createdAt) >= lastMonthStart && new Date(s.createdAt) < thisMonthStart);

  const totalRevenue = completedSales.reduce((a, s) => a + parseFloat(s.amount), 0);
  const totalSales = completedSales.length;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const conversionRate = allSales.length > 0 ? (completedSales.length / allSales.length) * 100 : 0;
  const refunds = allSales.filter((s) => s.status === "refunded").reduce((a, s) => a + parseFloat(s.amount), 0);

  const thisRevenue = thisMonth.reduce((a, s) => a + parseFloat(s.amount), 0);
  const lastRevenue = lastMonth.reduce((a, s) => a + parseFloat(s.amount), 0);

  function growth(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  const thisAvg = thisMonth.length > 0 ? thisRevenue / thisMonth.length : 0;
  const lastAvg = lastMonth.length > 0 ? lastRevenue / lastMonth.length : 0;

  const thisConv = allSales.filter((s) => new Date(s.createdAt) >= thisMonthStart).length;
  const lastConv = allSales.filter((s) => new Date(s.createdAt) >= lastMonthStart && new Date(s.createdAt) < thisMonthStart).length;
  const thisConvRate = thisConv > 0 ? (thisMonth.length / thisConv) * 100 : 0;
  const lastConvRate = lastConv > 0 ? (lastMonth.length / lastConv) * 100 : 0;

  const thisRefunds = allSales.filter((s) => s.status === "refunded" && new Date(s.createdAt) >= thisMonthStart).reduce((a, s) => a + parseFloat(s.amount), 0);
  const lastRefunds = allSales.filter((s) => s.status === "refunded" && new Date(s.createdAt) >= lastMonthStart && new Date(s.createdAt) < thisMonthStart).reduce((a, s) => a + parseFloat(s.amount), 0);

  res.json(GetDashboardSummaryResponse.parse({
    totalRevenue,
    totalSales,
    avgTicket,
    conversionRate,
    refunds,
    revenueGrowth: growth(thisRevenue, lastRevenue),
    salesGrowth: growth(thisMonth.length, lastMonth.length),
    ticketGrowth: growth(thisAvg, lastAvg),
    conversionGrowth: growth(thisConvRate, lastConvRate),
    refundGrowth: growth(thisRefunds, lastRefunds),
  }));
});

router.get("/dashboard/revenue-chart", async (req, res): Promise<void> => {
  const days = 30;
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const sales = await db.select().from(salesTable).where(gte(salesTable.createdAt, start));

  const map: Record<string, { revenue: number; sales: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { revenue: 0, sales: 0 };
  }

  for (const s of sales) {
    if (s.status !== "completed") continue;
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (map[key]) {
      map[key].revenue += parseFloat(s.amount);
      map[key].sales += 1;
    }
  }

  const result = Object.entries(map).map(([date, v]) => ({ date, ...v }));
  res.json(GetRevenueChartResponse.parse(result));
});

router.get("/dashboard/traffic-sources", async (_req, res): Promise<void> => {
  // Static representative data for MVP
  const sources = [
    { source: "Instagram", percentage: 42.5, count: 3593 },
    { source: "YouTube", percentage: 24.8, count: 2097 },
    { source: "Google Ads", percentage: 16.7, count: 1412 },
    { source: "E-mail", percentage: 9.3, count: 787 },
    { source: "Outros", percentage: 6.7, count: 567 },
  ];
  res.json(GetTrafficSourcesResponse.parse(sources));
});

router.get("/dashboard/top-products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.revenue)).limit(5);
  const result = products.map((p, i) => ({
    id: p.id,
    name: p.name,
    revenue: parseFloat(p.revenue),
    sales: p.sales,
    rank: i + 1,
  }));
  res.json(GetTopProductsResponse.parse(result));
});

router.get("/dashboard/wallet-summary", async (_req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable);
  let available = 0;
  let pending = 0;
  for (const tx of txs) {
    const amt = parseFloat(tx.amount);
    if (tx.type === "credit" || tx.type === "commission") available += amt;
    else if (tx.type === "debit" || tx.type === "withdrawal") available -= amt;
  }

  // Pending = sum of completed sales created in last 7 days (settlement window)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const sales = await db.select().from(salesTable);
  for (const s of sales) {
    if (s.status === "completed" && new Date(s.createdAt) >= cutoff) {
      pending += parseFloat(s.amount) * 0.3; // 30% still settling
    }
  }

  const total = Math.max(0, available) + pending;

  res.json(GetWalletSummaryResponse.parse({
    available: Math.max(0, available),
    pending,
    total,
  }));
});

export default router;
