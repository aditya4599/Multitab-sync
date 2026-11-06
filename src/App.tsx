import { useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "motion/react";
import "./App.css";

type Language = "en" | "es" | "fr";

type Preferences = {
  darkMode: boolean;
  language: Language;
  fontSize: number;
};

const STORAGE_KEY = "preferences";
const MIN_FONT = 12;
const MAX_FONT = 24;

const defaults: Preferences = {
  darkMode: false,
  language: "en",
  fontSize: 16,
};

const messages = {
  en: {
    title: "Preferences",
    subtitle: "Changes sync across open tabs.",
    darkMode: "Dark mode",
    language: "Language",
    fontSize: "Font size",
    preview: "This is how text will look at this size.",
    reset: "Restore defaults",
  },
  es: {
    title: "Preferencias",
    subtitle: "Los cambios se sincronizan entre pestañas.",
    darkMode: "Modo oscuro",
    language: "Idioma",
    fontSize: "Tamaño de texto",
    preview: "Así se verá el texto con este tamaño.",
    reset: "Restablecer valores",
  },
  fr: {
    title: "Préférences",
    subtitle: "Les changements se synchronisent entre les onglets.",
    darkMode: "Mode sombre",
    language: "Langue",
    fontSize: "Taille du texte",
    preview: "Voici à quoi ressemblera le texte à cette taille.",
    reset: "Réinitialiser",
  },
} as const;

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];


function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "es" || value === "fr";
}

function parsePreferences(raw: string | null): Preferences {
  if (!raw) return defaults;
  try {
    const p = JSON.parse(raw);
    return {
      darkMode:
        typeof p.darkMode === "boolean" ? p.darkMode : defaults.darkMode,
      language: isLanguage(p.language) ? p.language : defaults.language,
      fontSize:
        typeof p.fontSize === "number"
          ? Math.min(MAX_FONT, Math.max(MIN_FONT, p.fontSize))
          : defaults.fontSize,
    };
  } catch {
    return defaults;
  }
}

function loadPreferences(): Preferences {
  try {
    return parsePreferences(localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaults;
  }
}

// Animation presets

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

// Cross-fades text when the language changes.
function SwapText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={id}
        className="swap"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

// ---------- Controls ----------

function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  labelledBy: string;
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className="switch"
      data-on={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.94 }}
    >
      <motion.span
        className="knob"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </motion.button>
  );
}

function LanguagePicker({
  value,
  onChange,
  label,
}: {
  value: Language;
  onChange: (value: Language) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {languages.map((lang) => {
        const active = lang.value === value;
        return (
          <button
            key={lang.value}
            type="button"
            role="radio"
            aria-checked={active}
            className="segment"
            data-active={active}
            onClick={() => onChange(lang.value)}
          >
            {active && (
              <motion.span
                layoutId="language-pill"
                className="pill"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="segment-label">{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- App ----------

export default function App() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const { darkMode, language, fontSize } = preferences;
  const text = messages[language];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = darkMode ? "dark" : "light";
    root.style.fontSize = `${fontSize}px`;
    root.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // the UI still works.
    }
  }, [preferences, darkMode, fontSize, language]);

  
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      setPreferences(parsePreferences(event.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function update(patch: Partial<Preferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
  }

  const isDefault =
    darkMode === defaults.darkMode &&
    language === defaults.language &&
    fontSize === defaults.fontSize;

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        className="settings"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <motion.div variants={list} initial="hidden" animate="show">
          <motion.header className="header" variants={item}>
            <h1>
              <SwapText id={language}>{text.title}</SwapText>
            </h1>
            <p>
              <SwapText id={language}>{text.subtitle}</SwapText>
            </p>
          </motion.header>

          <div className="rows">
            <motion.div className="row" variants={item}>
              <span className="row-label" id="dark-mode-label">
                <SwapText id={language}>{text.darkMode}</SwapText>
              </span>
              <Toggle
                checked={darkMode}
                labelledBy="dark-mode-label"
                onChange={(value) => update({ darkMode: value })}
              />
            </motion.div>

            <motion.div className="row row-stack" variants={item}>
              <span className="row-label">
                <SwapText id={language}>{text.language}</SwapText>
              </span>
              <LanguagePicker
                value={language}
                label={text.language}
                onChange={(value) => update({ language: value })}
              />
            </motion.div>

            <motion.div className="row row-stack" variants={item}>
              <div className="row-head">
                <label className="row-label" htmlFor="font-size">
                  <SwapText id={language}>{text.fontSize}</SwapText>
                </label>
                <span className="value">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={fontSize}
                      className="swap"
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {fontSize}
                    </motion.span>
                  </AnimatePresence>
                  px
                </span>
              </div>
              <input
                id="font-size"
                className="slider"
                type="range"
                min={MIN_FONT}
                max={MAX_FONT}
                value={fontSize}
                onChange={(event) =>
                  update({ fontSize: Number(event.target.value) })
                }
              />
              <p className="preview">
                <SwapText id={language}>{text.preview}</SwapText>
              </p>
            </motion.div>
          </div>

          <motion.button
            type="button"
            className="reset"
            variants={item}
            disabled={isDefault}
            whileTap={isDefault ? undefined : { scale: 0.97 }}
            onClick={() => setPreferences(defaults)}
          >
            <SwapText id={language}>{text.reset}</SwapText>
          </motion.button>
        </motion.div>
      </motion.main>
    </MotionConfig>
  );
}
