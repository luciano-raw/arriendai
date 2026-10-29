ALTER TABLE "Contract" ADD COLUMN "paymentDay" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_paymentDay_check" CHECK ("paymentDay" BETWEEN 1 AND 31);
