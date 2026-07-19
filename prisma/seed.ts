import { prisma } from "../src/lib/prisma";
import { seedDatabase } from "./seedData";

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
