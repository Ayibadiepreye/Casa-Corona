import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (
    id subscription_plan PRIMARY KEY,
    name text NOT NULL,
    description text,
    amount_ngn integer NOT NULL,
    interval_label text NOT NULL,
    months_covered integer NOT NULL,
    discount_pct integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS subscription_plans_active_idx ON subscription_plans(active)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS subscription_plans_sort_idx ON subscription_plans(sort_order)`);
  console.log("✅ table + indexes");

  await pool.query(`
    INSERT INTO subscription_plans (id, name, description, amount_ngn, interval_label, months_covered, discount_pct, sort_order)
    VALUES
      ('monthly', 'Monthly', 'Pay month-to-month. Cancel anytime.', 50000, 'monthly', 1, 0, 1),
      ('3month', '3 Months', 'Save 6.7% vs monthly billing.', 140000, 'quarterly', 3, 7, 2),
      ('6month', '6 Months', 'Save 10% vs monthly billing.', 270000, 'biannual', 6, 10, 3),
      ('12month', '12 Months (Best Value)', 'Save 16.7% — our most popular plan.', 500000, 'annual', 12, 17, 4)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      amount_ngn = EXCLUDED.amount_ngn,
      interval_label = EXCLUDED.interval_label,
      months_covered = EXCLUDED.months_covered,
      discount_pct = EXCLUDED.discount_pct,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
  `);
  console.log("✅ seeded plans");

  const r = await pool.query("SELECT id, name, amount_ngn, discount_pct FROM subscription_plans ORDER BY sort_order");
  console.log("Current plans:", JSON.stringify(r.rows, null, 2));

  await pool.end();
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });