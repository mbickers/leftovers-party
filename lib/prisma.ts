import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
