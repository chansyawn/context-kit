import {
  createSkillLibraryError,
  skillLibraryErrorCodes,
} from "@/domain/skill-libraries/error-codes";
import { auth } from "@clerk/tanstack-react-start/server";

export async function getRequestSession(): Promise<{ userId: string } | null> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  return { userId };
}

export async function requireClerkUserId(): Promise<string> {
  const session = await getRequestSession();

  if (!session) {
    throw createSkillLibraryError(skillLibraryErrorCodes.authenticationRequired);
  }

  return session.userId;
}
