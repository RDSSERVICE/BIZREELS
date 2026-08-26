import React from 'react';

const POPULAR_LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Bengali',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Punjabi',
  'Kannada',
  'Malayalam',
  'Bhojpuri',
  'Rajasthani',
  'Urdu',
  'Odia',
  'Assamese',
  'Haryanvi'
];

export default function CreatorLanguagesSection({
  languages = '',
  setLanguages
}) {
  // Normalize languages into a safe comma-separated string
  const safeLangStr = Array.isArray(languages)
    ? languages.join(', ')
    : typeof languages === 'string'
    ? languages
    : '';

  // Parse comma-separated string into a trimmed array for easy chip matching
  const currentLangList = safeLangStr
    ? safeLangStr.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  const toggleLanguage = (langName) => {
    let updated;
    if (currentLangList.some((l) => l.toLowerCase() === langName.toLowerCase())) {
      updated = currentLangList.filter((l) => l.toLowerCase() !== langName.toLowerCase());
    } else {
      updated = [...currentLangList, langName];
    }
    setLanguages(updated.join(', '));
  };

  return (
    <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
      {/* Section Header with Onboarding Number Badge */}
      <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
        <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">
          4
        </span>
        <div>
          <h3
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-sm uppercase text-[#1a1a1a]"
          >
            LANGUAGES SPOKEN &amp; DIALECTS
          </h3>
          <p className="text-[11px] text-slate-500">
            Select the languages you can speak, record voice-overs in, or create video captions for
          </p>
        </div>
      </div>

      {/* Popular Language Badges matching Onboarding tag pill style */}
      <div>
        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">
          Select Languages Spoken *
        </label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LANGUAGES.map((lang) => {
            const isSelected = currentLangList.some(
              (l) => l.toLowerCase() === lang.toLowerCase()
            );
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-md text-xs font-extrabold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual text input for comma-separated or custom dialects */}
      <div>
        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
          Other Regional Dialects / Comma Separated Languages
        </label>
        <input
          type="text"
          placeholder="e.g. English, Hindi, Bhojpuri, Chhattisgarhi"
          value={safeLangStr}
          onChange={(e) => setLanguages(e.target.value)}
          className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
        />
      </div>
    </div>
  );
}
