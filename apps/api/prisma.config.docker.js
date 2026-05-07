'use strict';
// Config usada pelo runner Docker (sem TypeScript, sem @prisma/config).
// defineConfig é apenas um helper de tipos — o objeto puro funciona igual.
module.exports = {
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
