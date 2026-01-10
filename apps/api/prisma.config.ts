import path from "node:path";
import { defineConfig } from "prisma/config";

// Load root .env for monorepo structure
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
