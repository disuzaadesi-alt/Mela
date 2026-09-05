// Makes an existing user an admin. Run after that person has signed up once.
// Usage: node prisma/makeAdmin.js someone@example.com
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node prisma/makeAdmin.js someone@example.com");
    process.exit(1);
  }
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });
  console.log(`${user.email} is now an admin.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
