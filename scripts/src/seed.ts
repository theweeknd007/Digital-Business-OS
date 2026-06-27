import { db, productsTable, salesTable, transactionsTable, affiliatesTable, withdrawalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Products
  const products = await db.insert(productsTable).values([
    { name: "Método GOAT: Tráfego Pago", description: "Domine as campanhas de anúncios e escale suas vendas para 7 dígitos.", type: "course", price: "997", status: "active", sales: 0, revenue: "0" },
    { name: "Mentoria Elite 1:1", description: "Acompanhamento direto com o time GOAT por 90 dias.", type: "mentoring", price: "4997", status: "active", sales: 0, revenue: "0" },
    { name: "Comunidade GOAT Nation", description: "Acesso vitalício à maior comunidade de empreendedores digitais do Brasil.", type: "community", price: "297", status: "active", sales: 0, revenue: "0" },
    { name: "Pack de Templates Premium", description: "150+ templates profissionais para capturas e VSLs.", type: "digital", price: "197", status: "active", sales: 0, revenue: "0" },
    { name: "Masterclass: Copy que Converte", description: "Como escrever textos que vendem 24 horas por dia.", type: "digital", price: "97", status: "active", sales: 0, revenue: "0" },
    { name: "Evento Imersão GOAT 2026", description: "2 dias presenciais com os melhores do mercado digital.", type: "event", price: "1497", status: "draft", sales: 0, revenue: "0" },
  ]).returning();

  const [p1, p2, p3, p4, p5] = products;

  // Affiliates
  const affiliates = await db.insert(affiliatesTable).values([
    { name: "Rafael Monteiro", email: "rafael@affiliates.com", commissionRate: "30", totalSales: 0, totalCommission: "0", pendingCommission: "0", status: "active" },
    { name: "Camila Souza", email: "camila@affiliates.com", commissionRate: "25", totalSales: 0, totalCommission: "0", pendingCommission: "0", status: "active" },
    { name: "Lucas Alves", email: "lucas@affiliates.com", commissionRate: "20", totalSales: 0, totalCommission: "0", pendingCommission: "0", status: "inactive" },
  ]).returning();

  const [a1, a2] = affiliates;

  // Sales
  const salesData = [
    { productId: p1.id, productName: p1.name, customerName: "Marcos Oliveira", customerEmail: "marcos@email.com", amount: "997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a1.id },
    { productId: p1.id, productName: p1.name, customerName: "Fernanda Lima", customerEmail: "fernanda@email.com", amount: "997", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null },
    { productId: p2.id, productName: p2.name, customerName: "Roberto Silva", customerEmail: "roberto@email.com", amount: "4997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a2.id },
    { productId: p3.id, productName: p3.name, customerName: "Ana Paula Costa", customerEmail: "ana@email.com", amount: "297", status: "completed", paymentMethod: "boleto", country: "BR", affiliateId: null },
    { productId: p4.id, productName: p4.name, customerName: "Thiago Ferreira", customerEmail: "thiago@email.com", amount: "197", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a1.id },
    { productId: p5.id, productName: p5.name, customerName: "Juliana Rocha", customerEmail: "juliana@email.com", amount: "97", status: "pending", paymentMethod: "boleto", country: "BR", affiliateId: null },
    { productId: p1.id, productName: p1.name, customerName: "Diego Nascimento", customerEmail: "diego@email.com", amount: "997", status: "refunded", paymentMethod: "credit_card", country: "BR", affiliateId: null },
    { productId: p2.id, productName: p2.name, customerName: "Patricia Mendes", customerEmail: "patricia@email.com", amount: "4997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a2.id },
    { productId: p3.id, productName: p3.name, customerName: "Eduardo Barbosa", customerEmail: "edu@email.com", amount: "297", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null },
    { productId: p4.id, productName: p4.name, customerName: "Isabela Carvalho", customerEmail: "isa@email.com", amount: "197", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a1.id },
    { productId: p1.id, productName: p1.name, customerName: "Victor Hugo Santos", customerEmail: "victor@email.com", amount: "997", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null },
    { productId: p5.id, productName: p5.name, customerName: "Leticia Pereira", customerEmail: "leticia@email.com", amount: "97", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: a2.id },
  ];

  const insertedSales = await db.insert(salesTable).values(salesData).returning();

  // Compute product sales and revenue
  const productAgg = new Map<number, { sales: number; revenue: number }>();
  for (const s of insertedSales) {
    if (s.status === "completed") {
      const cur = productAgg.get(s.productId) ?? { sales: 0, revenue: 0 };
      cur.sales += 1;
      cur.revenue += parseFloat(s.amount);
      productAgg.set(s.productId, cur);
    }
  }
  for (const [pid, agg] of productAgg.entries()) {
    await db.update(productsTable)
      .set({ sales: agg.sales, revenue: String(agg.revenue) })
      .where(eq(productsTable.id, pid));
  }

  // Update affiliates stats
  const affAgg = new Map<number, { sales: number; commission: number }>();
  for (const s of insertedSales) {
    if (s.status === "completed" && s.affiliateId) {
      const aff = affiliates.find((a) => a.id === s.affiliateId);
      if (!aff) continue;
      const cur = affAgg.get(s.affiliateId) ?? { sales: 0, commission: 0 };
      cur.sales += 1;
      cur.commission += parseFloat(s.amount) * (parseFloat(aff.commissionRate) / 100);
      affAgg.set(s.affiliateId, cur);
    }
  }
  for (const [affId, agg] of affAgg.entries()) {
    await db.update(affiliatesTable)
      .set({ totalSales: agg.sales, totalCommission: String(agg.commission), pendingCommission: String(agg.commission * 0.4) })
      .where(eq(affiliatesTable.id, affId));
  }

  // Transactions (running balance)
  const completedSales = insertedSales.filter((s) => s.status === "completed");
  let runningBalance = 0;
  const txValues: { type: string; description: string; amount: string; balance: string; saleId: number | null }[] = [];
  for (const s of completedSales) {
    runningBalance += parseFloat(s.amount);
    txValues.push({
      type: "credit",
      description: `Venda aprovada - ${s.productName}`,
      amount: s.amount,
      balance: String(runningBalance),
      saleId: s.id,
    });
  }
  txValues.push({
    type: "withdrawal",
    description: "Saque PIX realizado",
    amount: "-2000",
    balance: String(runningBalance - 2000),
    saleId: null,
  });
  runningBalance -= 2000;
  txValues.push({
    type: "commission",
    description: "Comissão de afiliado recebida",
    amount: "450",
    balance: String(runningBalance + 450),
    saleId: null,
  });

  await db.insert(transactionsTable).values(txValues);

  // Withdrawal requests
  await db.insert(withdrawalsTable).values([
    { amount: "2000", status: "paid", pixKey: "admin@goatpay.com", notes: "Saque mensal" },
    { amount: "5000", status: "pending", pixKey: "11912345678", notes: "Reinvestimento em trafego" },
    { amount: "1500", status: "approved", pixKey: "admin@goatpay.com", notes: undefined },
  ]);

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
