const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDataLocally() {
  const allUsers = await prisma.user.findMany({ include: { predictions: true } });
  for (const u of allUsers) {
    const truePoints = u.predictions.reduce((acc, p) => acc + (p.pointsEarned || 0), 0);
    console.log(`User ${u.username} database points: ${u.points}, accurate points: ${truePoints}`);
    if (u.points !== truePoints) {
      await prisma.user.update({
        where: { id: u.id },
        data: { points: truePoints }
      });
      console.log(`Updated User ${u.username} to ${truePoints} points!`);
    }
  }
}

fixDataLocally()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
