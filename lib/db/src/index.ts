import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { usersTable, productsTable, salesTable, affiliatesTable, transactionsTable, withdrawalsTable, productMaterialsTable, storedAssetsTable } from "./schema";

const { Pool } = pg;

// ── In-Memory Database Store ──────────────────────────────────────────────────
function createInMemoryStore() {
  const adminHash = bcrypt.hashSync("GoatPay@2026", 10);
  const demoHash = bcrypt.hashSync("Demo@2026", 10);

  const tables: Record<string, any[]> = {
    users: [
      {
        id: 1,
        name: "Administrador GOAT",
        email: "admin@goatpay.com",
        passwordHash: adminHash,
        role: "admin",
        avatarUrl: null,
        active: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        id: 2,
        name: "SKILL Elite",
        email: "demo@goatpay.com",
        passwordHash: demoHash,
        role: "creator",
        avatarUrl: null,
        active: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ],
    products: [
      { id: 1, ownerId: 1, name: "Método GOAT: Tráfego Pago", description: "Domine as campanhas de anúncios e escale suas vendas para 7 dígitos.", type: "course", price: "997", currency: "MZN", status: "active", sales: 4, revenue: "3988", imageUrl: null, coverUrl: "/covers/p1.png", fileUrl: "/files/p1.pdf", fileName: "p1.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: new Date(), approvedBy: 1, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 25 * 86400000), updatedAt: new Date() },
      { id: 2, ownerId: 1, name: "Mentoria Elite 1:1", description: "Acompanhamento direto com o time GOAT por 90 dias.", type: "mentoring", price: "4997", currency: "MZN", status: "active", sales: 2, revenue: "9994", imageUrl: null, coverUrl: "/covers/p2.png", fileUrl: "/files/p2.pdf", fileName: "p2.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: new Date(), approvedBy: 1, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 20 * 86400000), updatedAt: new Date() },
      { id: 3, ownerId: 1, name: "Comunidade GOAT Nation", description: "Acesso vitalício à maior comunidade de empreendedores digitais do Brasil.", type: "community", price: "297", currency: "MZN", status: "active", sales: 2, revenue: "594", imageUrl: null, coverUrl: "/covers/p3.png", fileUrl: "/files/p3.pdf", fileName: "p3.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: new Date(), approvedBy: 1, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 15 * 86400000), updatedAt: new Date() },
      { id: 4, ownerId: 1, name: "Pack de Templates Premium", description: "150+ templates profissionais para capturas e VSLs.", type: "digital", price: "197", currency: "MZN", status: "active", sales: 2, revenue: "394", imageUrl: null, coverUrl: "/covers/p4.png", fileUrl: "/files/p4.pdf", fileName: "p4.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: new Date(), approvedBy: 1, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 10 * 86400000), updatedAt: new Date() },
      { id: 5, ownerId: 1, name: "Masterclass: Copy que Converte", description: "Como escrever textos que vendem 24 horas por dia.", type: "digital", price: "97", currency: "MZN", status: "active", sales: 2, revenue: "194", imageUrl: null, coverUrl: "/covers/p5.png", fileUrl: "/files/p5.pdf", fileName: "p5.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: new Date(), approvedBy: 1, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 5 * 86400000), updatedAt: new Date() },
      { id: 6, ownerId: 1, name: "Evento Imersão GOAT 2026", description: "2 dias presenciais com os melhores do mercado digital.", type: "event", price: "1497", currency: "MZN", status: "draft", sales: 0, revenue: "0", imageUrl: null, coverUrl: "/covers/p6.png", fileUrl: "/files/p6.pdf", fileName: "p6.pdf", fileContentType: "application/pdf", fileSize: 1024000, approvalNotes: null, approvedAt: null, approvedBy: null, whopProductId: null, whopPlanId: null, deliveryType: "internal", externalDeliveryUrl: null, externalAccessUrl: null, createdAt: new Date(Date.now() - 2 * 86400000), updatedAt: new Date() },
    ],
    affiliates: [
      { id: 1, name: "Rafael Monteiro", email: "rafael@affiliates.com", commissionRate: "30", totalSales: 4, totalCommission: "891", pendingCommission: "356.4", status: "active", createdAt: new Date() },
      { id: 2, name: "Camila Souza", email: "camila@affiliates.com", commissionRate: "25", totalSales: 3, totalCommission: "2523.5", pendingCommission: "1009.4", status: "active", createdAt: new Date() },
      { id: 3, name: "Lucas Alves", email: "lucas@affiliates.com", commissionRate: "20", totalSales: 0, totalCommission: "0", pendingCommission: "0", status: "inactive", createdAt: new Date() },
    ],
    sales: [
      { id: 1, productId: 1, productName: "Método GOAT: Tráfego Pago", customerName: "Marcos Oliveira", customerEmail: "marcos@email.com", amount: "997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 1, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 24 * 86400000) },
      { id: 2, productId: 1, productName: "Método GOAT: Tráfego Pago", customerName: "Fernanda Lima", customerEmail: "fernanda@email.com", amount: "997", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 22 * 86400000) },
      { id: 3, productId: 2, productName: "Mentoria Elite 1:1", customerName: "Roberto Silva", customerEmail: "roberto@email.com", amount: "4997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 2, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 20 * 86400000) },
      { id: 4, productId: 3, productName: "Comunidade GOAT Nation", customerName: "Ana Paula Costa", customerEmail: "ana@email.com", amount: "297", status: "completed", paymentMethod: "boleto", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 18 * 86400000) },
      { id: 5, productId: 4, productName: "Pack de Templates Premium", customerName: "Thiago Ferreira", customerEmail: "thiago@email.com", amount: "197", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 1, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 15 * 86400000) },
      { id: 6, productId: 5, productName: "Masterclass: Copy que Converte", customerName: "Juliana Rocha", customerEmail: "juliana@email.com", amount: "97", status: "pending", paymentMethod: "boleto", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 12 * 86400000) },
      { id: 7, productId: 1, productName: "Método GOAT: Tráfego Pago", customerName: "Diego Nascimento", customerEmail: "diego@email.com", amount: "997", status: "refunded", paymentMethod: "credit_card", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 10 * 86400000) },
      { id: 8, productId: 2, productName: "Mentoria Elite 1:1", customerName: "Patricia Mendes", customerEmail: "patricia@email.com", amount: "4997", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 2, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 8 * 86400000) },
      { id: 9, productId: 3, productName: "Comunidade GOAT Nation", customerName: "Eduardo Barbosa", customerEmail: "edu@email.com", amount: "297", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 6 * 86400000) },
      { id: 10, productId: 4, productName: "Pack de Templates Premium", customerName: "Isabela Carvalho", customerEmail: "isa@email.com", amount: "197", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 1, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 4 * 86400000) },
      { id: 11, productId: 1, productName: "Método GOAT: Tráfego Pago", customerName: "Victor Hugo Santos", customerEmail: "victor@email.com", amount: "997", status: "completed", paymentMethod: "credit_card", country: "BR", affiliateId: null, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 12, productId: 5, productName: "Masterclass: Copy que Converte", customerName: "Leticia Pereira", customerEmail: "leticia@email.com", amount: "97", status: "completed", paymentMethod: "pix", country: "BR", affiliateId: 2, whopPaymentId: null, whopEventId: null, buyerUserId: null, createdAt: new Date(Date.now() - 1 * 86400000) },
    ],
    transactions: [
      { id: 1, type: "credit", description: "Venda aprovada - Método GOAT", amount: "997", balance: "997", saleId: 1, createdAt: new Date(Date.now() - 20 * 86400000) },
      { id: 2, type: "credit", description: "Venda aprovada - Mentoria Elite", amount: "4997", balance: "5994", saleId: 3, createdAt: new Date(Date.now() - 18 * 86400000) },
      { id: 3, type: "withdrawal", description: "Saque PIX realizado", amount: "-2000", balance: "3994", saleId: null, createdAt: new Date(Date.now() - 14 * 86400000) },
      { id: 4, type: "commission", description: "Comissão de afiliado recebida", amount: "450", balance: "4444", saleId: null, createdAt: new Date(Date.now() - 7 * 86400000) },
      { id: 5, type: "credit", description: "Venda aprovada - Pack Templates", amount: "197", balance: "4641", saleId: 10, createdAt: new Date(Date.now() - 3 * 86400000) },
    ],
    withdrawals: [
      { id: 1, amount: "2000", status: "paid", pixKey: "admin@goatpay.com", notes: "Saque mensal", createdAt: new Date(Date.now() - 14 * 86400000) },
      { id: 2, amount: "5000", status: "pending", pixKey: "11912345678", notes: "Reinvestimento em tráfego", createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 3, amount: "1500", status: "approved", pixKey: "admin@goatpay.com", notes: null, createdAt: new Date(Date.now() - 1 * 86400000) },
    ],
    product_materials: [],
    stored_assets: [
      { id: 1, ownerId: 1, objectPath: "/covers/p1.png", name: "Capa P1", contentType: "image/png", fileSize: 500000, createdAt: new Date() },
      { id: 2, ownerId: 1, objectPath: "/files/p1.pdf", name: "Conteudo P1", contentType: "application/pdf", fileSize: 1024000, createdAt: new Date() },
    ],
  };

  function getTableName(tableObj: any): string {
    if (!tableObj) return "unknown";
    if (typeof tableObj === "string") return tableObj;
    // Drizzle pgTable symbols and properties
    const sym = Object.getOwnPropertySymbols(tableObj).find((s) => s.description === "drizzle:Name");
    if (sym && tableObj[sym]) return tableObj[sym];
    return tableObj._?.name || tableObj.name || "users";
  }

  function getList(tableObj: any): any[] {
    const name = getTableName(tableObj);
    if (!tables[name]) {
      tables[name] = [];
    }
    return tables[name];
  }

  function testCondition(row: any, cond: any): boolean {
    if (!cond) return true;
    try {
      // Drizzle SQL or binary condition
      if (Array.isArray(cond.conditions)) {
        return cond.conditions.every((c: any) => testCondition(row, c));
      }
      if (cond.operator === "and") {
        return (cond.conditions || []).every((c: any) => testCondition(row, c));
      }
      if (cond.operator === "or") {
        return (cond.conditions || []).some((c: any) => testCondition(row, c));
      }
      // Drizzle eq / gte / inArray
      const colName = cond.left?.name || cond.left?.key || cond.column?.name;
      const val = cond.right !== undefined ? cond.right : cond.value;
      if (colName && row[colName] !== undefined) {
        if (cond.operator === "=" || cond.operator === undefined) {
          if (typeof val === "string" && typeof row[colName] === "string") {
            return row[colName].toLowerCase() === val.toLowerCase();
          }
          return row[colName] == val;
        }
        if (cond.operator === ">=") {
          return new Date(row[colName]) >= new Date(val);
        }
        if (cond.operator === "<=") {
          return new Date(row[colName]) <= new Date(val);
        }
        if (cond.operator === "in" && Array.isArray(val)) {
          return val.includes(row[colName]);
        }
      }
      // Check query chunks
      if (cond.queryChunks) {
        for (const chunk of cond.queryChunks) {
          if (chunk?.value !== undefined && colName) {
            return row[colName] == chunk.value;
          }
        }
      }
    } catch {
      // Fallback
    }
    return true;
  }

  let nextId = 100;

  const mockDb: any = {
    select: () => ({
      from: (table: any) => {
        const list = getList(table);
        let results = [...list];

        const queryObj: any = {
          where: (cond: any) => {
            results = results.filter((r) => testCondition(r, cond));
            return queryObj;
          },
          orderBy: (order: any) => {
            return queryObj;
          },
          limit: (n: number) => {
            results = results.slice(0, n);
            return queryObj;
          },
          then: (resolve: any, reject?: any) => {
            return Promise.resolve(results).then(resolve, reject);
          },
          [Symbol.asyncIterator]: () => results[Symbol.iterator](),
        };

        return queryObj;
      },
    }),

    insert: (table: any) => ({
      values: (vals: any | any[]) => {
        const list = getList(table);
        const toInsert = Array.isArray(vals) ? vals : [vals];
        const inserted = toInsert.map((item) => {
          const newItem = {
            id: item.id || ++nextId,
            ...item,
            createdAt: item.createdAt || new Date(),
            updatedAt: item.updatedAt || new Date(),
          };
          list.push(newItem);
          return newItem;
        });

        const resObj: any = {
          returning: () => Promise.resolve(inserted),
          then: (resolve: any, reject?: any) => Promise.resolve(inserted).then(resolve, reject),
        };
        return resObj;
      },
    }),

    update: (table: any) => ({
      set: (updates: any) => ({
        where: (cond: any) => {
          const list = getList(table);
          const updated: any[] = [];
          for (let i = 0; i < list.length; i++) {
            if (testCondition(list[i], cond)) {
              list[i] = { ...list[i], ...updates, updatedAt: new Date() };
              updated.push(list[i]);
            }
          }
          return {
            returning: () => Promise.resolve(updated),
            then: (resolve: any, reject?: any) => Promise.resolve(updated).then(resolve, reject),
          };
        },
      }),
    }),

    delete: (table: any) => ({
      where: (cond: any) => {
        const list = getList(table);
        const name = getTableName(table);
        const remaining: any[] = [];
        const deleted: any[] = [];
        for (const item of list) {
          if (testCondition(item, cond)) {
            deleted.push(item);
          } else {
            remaining.push(item);
          }
        }
        tables[name] = remaining;
        return {
          returning: () => Promise.resolve(deleted),
          then: (resolve: any, reject?: any) => Promise.resolve(deleted).then(resolve, reject),
        };
      },
    }),
  };

  return mockDb;
}

// ── Database Initialization ───────────────────────────────────────────────────
let poolInstance: any = null;
let dbInstance: any = null;

if (process.env.DATABASE_URL) {
  try {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzle(poolInstance, { schema });
    console.log("Connected to PostgreSQL via DATABASE_URL");
  } catch (err) {
    console.warn("Could not initialize PostgreSQL pool, using in-memory mock store:", err);
    dbInstance = createInMemoryStore();
  }
} else {
  console.warn("DATABASE_URL not set — using in-memory mock store with preloaded demo data");
  dbInstance = createInMemoryStore();
}

export const pool = poolInstance;
export const db = dbInstance;

export * from "./schema";
