import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "uz" | "ru" | "en";

type Dict = Record<string, { uz: string; ru: string; en: string }>;

const DICT: Dict = {
  // Navigation
  "nav.home": { uz: "Bosh sahifa", ru: "Главная", en: "Home" },
  "nav.announcements": { uz: "E'lonlar", ru: "Объявления", en: "Announcements" },
  "nav.marketplace": { uz: "Bozor", ru: "Базар", en: "Marketplace" },
  "nav.services": { uz: "Xizmatlar", ru: "Услуги", en: "Services" },
  "nav.gov": { uz: "Davlat xizmatlari", ru: "Госуслуги", en: "Gov services" },
  "nav.health": { uz: "Sog'liq", ru: "Здоровье", en: "Health" },
  "nav.education": { uz: "Ta'lim", ru: "Образование", en: "Education" },
  "nav.forum": { uz: "Forum", ru: "Форум", en: "Forum" },
  "nav.profile": { uz: "Profil", ru: "Профиль", en: "Profile" },
  "nav.add": { uz: "Qo'shish", ru: "Добавить", en: "Add" },

  // Common
  "common.search": { uz: "Qidirish...", ru: "Поиск...", en: "Search..." },
  "common.cancel": { uz: "Bekor qilish", ru: "Отмена", en: "Cancel" },
  "common.save": { uz: "Saqlash", ru: "Сохранить", en: "Save" },
  "common.publish": { uz: "E'lon qilish", ru: "Опубликовать", en: "Publish" },
  "common.delete": { uz: "O'chirish", ru: "Удалить", en: "Delete" },
  "common.edit": { uz: "Tahrirlash", ru: "Изменить", en: "Edit" },
  "common.signin": { uz: "Kirish", ru: "Войти", en: "Sign in" },
  "common.signout": { uz: "Chiqish", ru: "Выйти", en: "Sign out" },
  "common.loading": { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Loading..." },
  "common.empty": { uz: "Hozircha hech narsa yo'q", ru: "Пока ничего нет", en: "Nothing here yet" },
  "common.empty.cta": { uz: "Birinchi bo'lib qo'shing", ru: "Будьте первым", en: "Be the first to add" },
  "common.required_auth": { uz: "Bu amal uchun tizimga kirish kerak", ru: "Нужно войти", en: "Sign in required" },
  "common.all": { uz: "Hammasi", ru: "Все", en: "All" },

  // Hero / Home
  "home.welcome": { uz: "Assalomu alaykum", ru: "Здравствуйте", en: "Welcome" },
  "home.tagline": { uz: "Qishloq jamoasi bir bosishda", ru: "Сообщество в одном касании", en: "Your community, one tap away" },
  "home.quickActions": { uz: "Tez harakatlar", ru: "Быстрые действия", en: "Quick actions" },
  "home.latestAnn": { uz: "So'nggi e'lonlar", ru: "Свежие объявления", en: "Latest announcements" },
  "home.market": { uz: "Bozordan", ru: "С базара", en: "From the market" },
  "home.stats": { uz: "Bugungi jamoamiz", ru: "Сообщество сегодня", en: "Community today" },

  // Forms
  "form.title": { uz: "Sarlavha", ru: "Заголовок", en: "Title" },
  "form.description": { uz: "Tavsif", ru: "Описание", en: "Description" },
  "form.content": { uz: "Matn", ru: "Содержание", en: "Content" },
  "form.category": { uz: "Kategoriya", ru: "Категория", en: "Category" },
  "form.price": { uz: "Narx (so'm)", ru: "Цена (сум)", en: "Price (UZS)" },
  "form.phone": { uz: "Telefon", ru: "Телефон", en: "Phone" },
  "form.type": { uz: "Turi", ru: "Тип", en: "Type" },
  "form.address": { uz: "Manzil", ru: "Адрес", en: "Address" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("qn-lang") as Lang | null;
    if (saved && ["uz", "ru", "en"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("qn-lang", l);
  };

  const t = (key: string) => DICT[key]?.[lang] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT must be used inside I18nProvider");
  return ctx;
}
