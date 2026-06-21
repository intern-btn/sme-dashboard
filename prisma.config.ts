import "dotenv/config";
import { config as loadLocal } from "dotenv";
import { defineConfig } from "prisma/config";

// Mirror Next.js behaviour: .env.local overrides .env
loadLocal({ path: ".env.local", override: false }); // shell vars always win

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
