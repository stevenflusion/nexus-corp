import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function clean() {
    console.log("Cleaning magic_link_activity...");
    await db.execute("TRUNCATE TABLE magic_link_activity CASCADE");
    console.log("Cleaning magic_links...");
    await db.execute("TRUNCATE TABLE magic_links CASCADE");
    console.log("Done! Tables are clean.");
    await pool.end();
}

clean().catch((err) => {
    console.error("Error cleaning tables:", err);
    process.exit(1);
});
