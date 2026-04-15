import { createContext, useContext, useState } from "react";
import type { Lang } from "../i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LanguageContext = createContext<Ctx>({ lang: "es", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("app_lang") as Lang) ?? "es";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("app_lang", l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
