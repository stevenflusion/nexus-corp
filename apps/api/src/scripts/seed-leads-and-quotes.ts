/**
 * Seed script: 6 leads (2 per source: web, manual, quote) with quotes.
 * Uses Drizzle directly — does NOT require the backend to be running.
 *
 * Run from the repo root with:
 *   npx tsx apps/api/src/scripts/seed-leads-and-quotes.ts
 */

import "dotenv/config";
import { db } from "../database/database.ts";
import { leads } from "../database/schemas/leads.ts";
import { quotes } from "../database/schemas/quotes.ts";

async function main() {
  console.log("Seeding 6 leads with quotes...");

  // ── 2 leads from WEB ──────────────────────────────────────────
  const [web1] = await db
    .insert(leads)
    .values({
      name_leads: "Carlos Mendoza",
      email_leads: "carlos.m@ejemplo.com",
      phone_leads: "0991234567",
      city_leads: "Quito",
      status_leads: "new",
      source_leads: "web",
      monthly_family_income: "2500.00",
      coments_optionals_lead: "Llegó desde el formulario de contacto",
      accepted_terms_lead: true,
      accepted_terms_at: new Date("2026-07-01T10:00:00Z"),
      accepted_terms_ip: "190.12.34.10",
    })
    .returning();

  const [web2] = await db
    .insert(leads)
    .values({
      name_leads: "Laura Sánchez",
      email_leads: "laura.s@ejemplo.com",
      phone_leads: "0987654321",
      city_leads: "Guayaquil",
      status_leads: "contacted",
      source_leads: "web",
      monthly_family_income: "3200.00",
      coments_optionals_lead: "Interesada en vivienda",
      accepted_terms_lead: true,
      accepted_terms_at: new Date("2026-07-02T14:30:00Z"),
      accepted_terms_ip: "190.12.34.20",
    })
    .returning();

  // ── 2 leads from MANUAL ───────────────────────────────────────
  const [manual1] = await db
    .insert(leads)
    .values({
      name_leads: "Pedro Vásquez",
      email_leads: "pedro.v@ejemplo.com",
      phone_leads: "0971112223",
      city_leads: "Cuenca",
      status_leads: "qualified",
      source_leads: "manual",
      monthly_family_income: "4500.00",
      coments_optionals_lead: "Referido por asesor externo",
      accepted_terms_lead: false,
    })
    .returning();

  const [manual2] = await db
    .insert(leads)
    .values({
      name_leads: "Ana Torres",
      email_leads: "ana.t@ejemplo.com",
      phone_leads: "0964445556",
      city_leads: "Ambato",
      status_leads: "new",
      source_leads: "manual",
      monthly_family_income: "1800.00",
      coments_optionals_lead: "Se inscribió al webinar",
      accepted_terms_lead: true,
      accepted_terms_at: new Date("2026-07-03T09:15:00Z"),
      accepted_terms_ip: "190.12.34.30",
    })
    .returning();

  // ── 2 leads from QUOTE (cotizador) ────────────────────────────
  const [quote1] = await db
    .insert(leads)
    .values({
      name_leads: "Mateo Velasco",
      email_leads: "mateo@ejemplo.com",
      phone_leads: "0984603189",
      city_leads: "Quito",
      status_leads: "new",
      source_leads: "quote",
      monthly_family_income: "1800.00",
      coments_optionals_lead: "Cotizó vehículo desde el wizard",
      accepted_terms_lead: true,
      accepted_terms_at: new Date("2026-07-04T10:15:00Z"),
      accepted_terms_ip: "190.12.34.56",
    })
    .returning();

  const [quote2] = await db
    .insert(leads)
    .values({
      name_leads: "Diana Ramírez",
      email_leads: "diana.r@ejemplo.com",
      phone_leads: "0957778889",
      city_leads: "Manta",
      status_leads: "lost",
      source_leads: "quote",
      monthly_family_income: "2200.00",
      coments_optionals_lead: "Cotizó consumo, no avanzó",
      accepted_terms_lead: true,
      accepted_terms_at: new Date("2026-07-05T16:45:00Z"),
      accepted_terms_ip: "190.12.34.78",
    })
    .returning();

  // ── Quotes for each lead ──────────────────────────────────────
  await db.insert(quotes).values([
    // Web lead 1 — vehicle
    {
      lead_id: web1.id_leads,
      product_quotes: "vehicle",
      requested_amount_quotes: "28000.00",
      down_payment_quotes: "5600.00",
      term_months_quotes: 60,
      annual_interest_rate_quotes: "12.00",
      monthly_payment_quotes: "373.15",
      contact_preference_quotes: "whatsapp",
      result_status_quotes: "Escenario ajustado",
    },
    // Web lead 2 — housing
    {
      lead_id: web2.id_leads,
      product_quotes: "housing",
      requested_amount_quotes: "85000.00",
      down_payment_quotes: "21250.00",
      term_months_quotes: 180,
      annual_interest_rate_quotes: "4.99",
      monthly_payment_quotes: "445.67",
      contact_preference_quotes: "phone",
      result_status_quotes: "Escenario preliminar compatible",
    },
    // Manual lead 1 — consumer
    {
      lead_id: manual1.id_leads,
      product_quotes: "consumer",
      requested_amount_quotes: "12000.00",
      down_payment_quotes: "0.00",
      term_months_quotes: 36,
      annual_interest_rate_quotes: "16.77",
      monthly_payment_quotes: "373.15",
      contact_preference_quotes: "email",
      result_status_quotes: "Compatible, con entrada por reforzar",
    },
    // Manual lead 2 — vehicle
    {
      lead_id: manual2.id_leads,
      product_quotes: "vehicle",
      requested_amount_quotes: "15000.00",
      down_payment_quotes: "3000.00",
      term_months_quotes: 48,
      annual_interest_rate_quotes: "12.00",
      monthly_payment_quotes: "245.80",
      contact_preference_quotes: "whatsapp",
      result_status_quotes: "Revisar escenario",
    },
    // Quote lead 1 — vehicle
    {
      lead_id: quote1.id_leads,
      product_quotes: "vehicle",
      requested_amount_quotes: "32000.00",
      down_payment_quotes: "6400.00",
      term_months_quotes: 72,
      annual_interest_rate_quotes: "12.00",
      monthly_payment_quotes: "398.50",
      contact_preference_quotes: "whatsapp",
      result_status_quotes: "Escenario ajustado",
    },
    // Quote lead 2 — consumer
    {
      lead_id: quote2.id_leads,
      product_quotes: "consumer",
      requested_amount_quotes: "8000.00",
      down_payment_quotes: "0.00",
      term_months_quotes: 24,
      annual_interest_rate_quotes: "16.77",
      monthly_payment_quotes: "312.40",
      contact_preference_quotes: "phone",
      result_status_quotes: "Revisar escenario",
    },
  ]);

  console.log("\n✅ Seeded successfully!");
  console.log(`   Leads created: 6`);
  console.log(`   Quotes created: 6`);
  console.log("\nLead IDs:");
  console.log(`   web:     ${web1.id_leads}, ${web2.id_leads}`);
  console.log(`   manual:  ${manual1.id_leads}, ${manual2.id_leads}`);
  console.log(`   quote:   ${quote1.id_leads}, ${quote2.id_leads}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
