import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import { hashPassword } from "../crypto/passwordHasher.js";

export const SEED_MATRICULA = "L03137164";
const SEED_PASSWORD = "Master4ninja!";
const SEED_FULL_NAME = "Maestro Inicial";

export async function bootstrapInitialMaster(repo: AppUserRepo): Promise<void> {
  const existing = await repo.count();
  if (existing > 0) {
    console.log(`[seed] ${existing} AppUser(s) already present — skipping seed`);
    return;
  }
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const user = await repo.create({
    matricula: SEED_MATRICULA,
    passwordHash,
    role: "master",
    fullName: SEED_FULL_NAME,
  });
  console.log(
    `[seed] initial master created: ${user.matricula} (${user.id}) — login with password from plan`,
  );
}
