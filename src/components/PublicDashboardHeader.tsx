"use client";

import Image from "next/image";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  PUBLIC_LANG_COOKIE,
  publicHeaderMessages,
  type PublicLang,
} from "@/lib/public-i18n";

type Props = {
  lang: PublicLang;
};

export function PublicDashboardHeader({ lang }: Props) {
  const [logoFailed, setLogoFailed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = publicHeaderMessages[lang];

  function switchLanguage(nextLang: PublicLang) {
    if (nextLang === lang) {
      return;
    }

    document.cookie = `${PUBLIC_LANG_COOKIE}=${nextLang}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLang);
    const target = `${pathname}?${params.toString()}` as Route;
    router.push(target);
  }

  return (
    <header className="public-topbar">
      <div className="public-brand">
        <div className="public-logo-wrap" aria-hidden="true">
          {logoFailed
            ? <span className="public-logo-fallback">uT</span>
            : (
              <Image
                src="/logo.png"
                alt={labels.logoAlt}
                width={34}
                height={34}
                className="public-logo-image"
                onError={() => setLogoFailed(true)}
              />
            )}
        </div>
        <div className="public-brand-text">
          <strong>{labels.appTitle}</strong>
          <span>{labels.appSubtitle}</span>
        </div>
      </div>

      <div className="public-lang-switch" aria-label={labels.languageLabel}>
        <button
          type="button"
          className={`public-lang-button ${lang === "de" ? "active" : ""}`}
          onClick={() => switchLanguage("de")}
          aria-pressed={lang === "de"}
          title={labels.german}
        >
          <span aria-hidden="true">🇩🇪</span>
          <span>DE</span>
        </button>
        <button
          type="button"
          className={`public-lang-button ${lang === "en" ? "active" : ""}`}
          onClick={() => switchLanguage("en")}
          aria-pressed={lang === "en"}
          title={labels.english}
        >
          <span aria-hidden="true">🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    </header>
  );
}
