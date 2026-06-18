export function formatGithubError(error: unknown): Error {
  const status = readStatus(error);

  if (status === 401) {
    return new Error("GitHub authorization expired. Sign in again.");
  }

  if (status === 403) {
    return new Error("GitHub denied this request or the API rate limit was reached.");
  }

  if (status === 404) {
    return new Error("The GitHub repository or path is no longer available.");
  }

  if (status === 422) {
    return new Error("GitHub rejected the repository request.");
  }

  return new Error("Unable to read data from GitHub.");
}

function readStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  const { status } = error;

  return typeof status === "number" ? status : null;
}
