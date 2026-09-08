import { prisma } from "../lib/prisma";
import { seedDemoDatabase } from "../services/demo-seed";

seedDemoDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
