import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config. Migrations connect through a driver adapter rather than a
 * `url` in schema.prisma.
 *
 * Local dev Postgres:  npx prisma dev -n xirevoa -d
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
