CREATE TABLE "AiConfiguration" (
  "id" TEXT NOT NULL, "encryptedKey" TEXT,
  "model" TEXT NOT NULL DEFAULT 'deepseek-chat',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiConfiguration_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiRateLimit" (
  "userId" TEXT NOT NULL, "lastRequestedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiRateLimit_pkey" PRIMARY KEY ("userId")
);
