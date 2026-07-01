import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "my", label: "မြန်မာ" },
  { code: "ru", label: "Русский" },
];

export default function LocaleSwitcher({ className = "", compact = false }) {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();

  const changeLanguage = (locale) => {
    router.push(router.pathname, router.asPath, { locale, scroll: false });
  };

  const currentLocale = router.locale || i18n.language || "en";

  return (
    <label
      className={`relative inline-flex items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/[0.1] ${className}`}
    >
      <span className="sr-only">{t("common.changeLanguage")}</span>
      <select
        aria-label={t("common.changeLanguage")}
        value={currentLocale}
        onChange={(event) => changeLanguage(event.target.value)}
        className={`cursor-pointer appearance-none bg-transparent pr-${compact ? "4" : "6"} text-sm font-semibold text-white outline-none ${compact ? "max-w-[72px]" : ""}`}
      >
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code} className="bg-[#06101F] text-white">
            {language.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-white/70">▾</span>
    </label>
  );
}
