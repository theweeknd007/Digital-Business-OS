import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@goatpay.com";
const ADMIN_PASSWORD = "GoatPay@2026";
const ADMIN_NAME = "Administrador GOAT";

async function seedAdmin() {
  console.log("🔐 Verificando usuário admin...");

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL));

  if (existing) {
    // Update password hash to ensure it's current
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.update(usersTable)
      .set({ passwordHash, role: "admin", active: true, name: ADMIN_NAME })
      .where(eq(usersTable.email, ADMIN_EMAIL));
    console.log(`✅ Admin atualizado: ${ADMIN_EMAIL}`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.insert(usersTable).values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      active: true,
    });
    console.log(`✅ Admin criado: ${ADMIN_EMAIL}`);
  }

  // Seed a demo creator user
  const [demoExisting] = await db.select().from(usersTable).where(eq(usersTable.email, "demo@goatpay.com"));
  if (!demoExisting) {
    const passwordHash = await bcrypt.hash("Demo@2026", 12);
    await db.insert(usersTable).values({
      name: "SKILL Elite",
      email: "demo@goatpay.com",
      passwordHash,
      role: "creator",
      active: true,
    });
    console.log("✅ Usuário demo criado: demo@goatpay.com / Demo@2026");
  }

  console.log("\n📋 Credenciais:");
  console.log(`   Admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Demo:   demo@goatpay.com / Demo@2026`);

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Erro ao fazer seed:", err);
  process.exit(1);
});
