import { PrismaPg } from './node_modules/@prisma/adapter-pg/dist/index.js';
import { PrismaClient } from './src/generated/prisma/client.ts';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await prisma.user.deleteMany({ where:{email:'x@example.com'} });
  const u = await prisma.user.create({ data:{ email:'x@example.com', username:'xver', name:'x', emailVerified:new Date() } });
  console.log('user created', u.id.slice(0,8));
  const a = await prisma.account.create({ data:{ userId:u.id, type:'oidc', provider:'google', providerAccountId:'g-x' } });
  console.log('account created', a.provider);
} catch(e) {
  console.log('ERROR:', e.message.slice(0,300));
}
await prisma.$disconnect();
