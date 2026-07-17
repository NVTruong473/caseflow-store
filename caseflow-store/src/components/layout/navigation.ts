import type { Language } from "@/lib/i18n/language";

const navigationCopy = {
  en: {
    siteNavigation: [
      { label: "Home", href: "/" },
      { label: "Catalog", href: "/catalog" },
      { label: "Categories", href: "/#categories" },
      { label: "Editions", href: "/#translated-editions" },
      { label: "Track order", href: "/orders/track" },
      { label: "Admin", href: "/admin" },
    ],
    discoveryNavigation: [
      { label: "New arrivals", href: "/#new-arrivals" },
      { label: "Current offers", href: "/#offers" },
      { label: "Vietnamese recommendations", href: "/#vietnamese-recommendations" },
    ],
    footerNavigation: [
      {
        title: "Shop",
        links: [
          { label: "All catalog", href: "/catalog" },
          { label: "Book categories", href: "/#categories" },
          { label: "Featured books", href: "/#featured" },
          { label: "New arrivals", href: "/#new-arrivals" },
          { label: "English/Vietnamese editions", href: "/#translated-editions" },
          { label: "Vietnamese recommendations", href: "/#vietnamese-recommendations" },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Order support", href: "/#support" },
          { label: "Track order", href: "/orders/track" },
          { label: "Current offers", href: "/#offers" },
          { label: "Admin console", href: "/admin" },
        ],
      },
    ],
  },
  vi: {
    siteNavigation: [
      { label: "Trang chủ", href: "/" },
      { label: "Catalog", href: "/catalog" },
      { label: "Danh mục", href: "/#categories" },
      { label: "Ấn bản", href: "/#translated-editions" },
      { label: "Tra cứu đơn", href: "/orders/track" },
      { label: "Quản trị", href: "/admin" },
    ],
    discoveryNavigation: [
      { label: "Ấn bản mới", href: "/#new-arrivals" },
      { label: "Ưu đãi hiện có", href: "/#offers" },
      { label: "Gợi ý tiếng Việt", href: "/#vietnamese-recommendations" },
    ],
    footerNavigation: [
      {
        title: "Mua sách",
        links: [
          { label: "Tất cả catalog", href: "/catalog" },
          { label: "Danh mục sách", href: "/#categories" },
          { label: "Sách nổi bật", href: "/#featured" },
          { label: "Ấn bản mới", href: "/#new-arrivals" },
          { label: "Ấn bản Anh/Việt", href: "/#translated-editions" },
          { label: "Gợi ý tiếng Việt", href: "/#vietnamese-recommendations" },
        ],
      },
      {
        title: "Hỗ trợ",
        links: [
          { label: "Hỗ trợ đơn hàng", href: "/#support" },
          { label: "Tra cứu đơn hàng", href: "/orders/track" },
          { label: "Ưu đãi hiện có", href: "/#offers" },
          { label: "Trang quản trị", href: "/admin" },
        ],
      },
    ],
  },
} as const;

export function getSiteNavigation(language: Language) {
  return navigationCopy[language].siteNavigation;
}

export function getDiscoveryNavigation(language: Language) {
  return navigationCopy[language].discoveryNavigation;
}

export function getFooterNavigation(language: Language) {
  return navigationCopy[language].footerNavigation;
}
