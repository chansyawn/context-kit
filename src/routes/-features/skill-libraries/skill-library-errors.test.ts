import { skillLibraryErrorCodes } from "@/domain/skill-libraries/error-codes";
import { describe, expect, it } from "vite-plus/test";

import { getSkillLibraryErrorAction } from "./skill-library-errors";

describe("skill library error actions", () => {
  it("requires a new login when authentication expires", () => {
    expect(
      getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.authenticationRequired)),
    ).toBe("login");
  });

  it("connects GitHub when the GitHub user authorization is missing", () => {
    expect(
      getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.githubAuthorizationRequired)),
    ).toBe("connect-github");
  });

  it("connects GitHub when authorization fails or expires", () => {
    expect(
      getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.githubAuthorizationFailed)),
    ).toBe("connect-github");
  });

  it("connects GitHub when GitHub is temporarily unavailable", () => {
    expect(getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.githubUnavailable))).toBe(
      "connect-github",
    );
  });

  it("does not offer an action for invalid server configuration", () => {
    expect(
      getSkillLibraryErrorAction(new Error(skillLibraryErrorCodes.githubConfigurationInvalid)),
    ).toBeNull();
  });

  it("opens GitHub access management when repository access is unavailable", () => {
    const code = skillLibraryErrorCodes.githubResourceUnavailable;

    expect(getSkillLibraryErrorAction(new Error(code))).toBe("manage-access");
  });

  it.each([skillLibraryErrorCodes.githubRateLimited, skillLibraryErrorCodes.githubRequestInvalid])(
    "retries transient request error %s",
    (code) => {
      expect(getSkillLibraryErrorAction(new Error(code))).toBe("retry");
    },
  );
});
