import { I18nStateProvider, useI18nState } from "@/app/i18n";
import { renderWithProviders } from "@/test/render";
import { useLingui } from "@lingui/react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

function setNavigatorLanguage(language: string): void {
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: [language],
  });
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
}

function I18nProbe() {
  const { i18n } = useLingui();
  const { locale, setLocale } = useI18nState();

  return (
    <section aria-label="I18n State">
      <p>{`${locale}:${i18n._({ id: "home.breadcrumb.page", message: "Skills" })}`}</p>
      <button type="button" onClick={() => setLocale("zh-Hans")}>
        Use Simplified Chinese
      </button>
    </section>
  );
}

describe("I18nStateProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorLanguage("en-US");
  });

  afterEach(() => {
    document.documentElement.lang = "en";
    localStorage.clear();
    setNavigatorLanguage("en-US");
  });

  it("activates the default English locale", async () => {
    renderWithProviders(
      <I18nStateProvider>
        <I18nProbe />
      </I18nStateProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
      expect(screen.getByLabelText("I18n State")).toHaveTextContent("en:Skills");
    });
  });

  it("normalizes browser zh locales to zh-Hans", async () => {
    setNavigatorLanguage("zh-CN");

    renderWithProviders(
      <I18nStateProvider>
        <I18nProbe />
      </I18nStateProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh-Hans");
      expect(screen.getByLabelText("I18n State")).toHaveTextContent("zh-Hans:技能");
    });
  });

  it("switches locale and writes through the preference boundary", async () => {
    renderWithProviders(
      <I18nStateProvider>
        <I18nProbe />
      </I18nStateProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Use Simplified Chinese" }));

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh-Hans");
      expect(screen.getByLabelText("I18n State")).toHaveTextContent("zh-Hans:技能");
    });
  });
});
