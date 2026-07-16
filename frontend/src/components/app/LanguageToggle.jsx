import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LanguageToggle({ compact = false }) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");
  useEffect(() => { setLang(i18n.language || "en"); }, [i18n.language]);
  const change = (val) => {
    setLang(val);
    i18n.changeLanguage(val);
    try { localStorage.setItem("bizreels_lang", val); } catch {}
  };
  return (
    <Select value={lang} onValueChange={change}>
      <SelectTrigger
        className={`bg-white/5 border-white/10 text-white rounded-full ${compact ? "h-8 px-3 text-xs w-24" : "h-9 px-3 text-sm w-28"}`}
        data-testid="language-toggle"
      >
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-neutral-900 border-white/10 text-white">
        <SelectItem value="en" data-testid="lang-en">English</SelectItem>
        <SelectItem value="hi" data-testid="lang-hi">हिन्दी</SelectItem>
      </SelectContent>
    </Select>
  );
}
