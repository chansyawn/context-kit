import { skillLibraryErrorCodes } from "@/domain/skill-libraries/error-codes";
import { describe, expect, it } from "vite-plus/test";

import { getSkillLibraryErrorAction } from "./skill-library-errors";

describe("skill library error actions", () => {
  it("requires a new login when authentication expires", () => {
    expect(
      getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.authenticationRequired)),
    ).toBe("login");
  });

  it.each([
    skillLibraryErrorCodes.githubAuthorizationRequired,
    skillLibraryErrorCodes.githubResourceUnavailable,
  ])("opens GitHub access management for %s", (code) => {
    expect(getSkillLibraryErrorAction(new Error(code))).toBe("manage-access");
  });

  it.each([
    skillLibraryErrorCodes.githubRateLimited,
    skillLibraryErrorCodes.githubRequestInvalid,
    skillLibraryErrorCodes.githubUnavailable,
  ])("retries transient request error %s", (code) => {
    expect(getSkillLibraryErrorAction(new Error(code))).toBe("retry");
  });
});
