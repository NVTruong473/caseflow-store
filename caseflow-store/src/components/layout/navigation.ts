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
          { label: "New arrivals", href: "/#new-arrivals" },
          { label: "English/Vietnamese editions", href: "/#translated-editions" },
          { label: "Current offers", href: "/#offers" },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Contact support", href: "/contact" },
          { label: "Shipping policy", href: "/shipping" },
          { label: "Payment policy", href: "/payment" },
          { label: "Returns policy", href: "/returns" },
          { label: "Track order", href: "/orders/track" },
          { label: "Account", href: "/account" },
        ],
      },
      {
        title: "Store policies",
        links: [
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
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
          { label: "Ấn bản mới", href: "/#new-arrivals" },
          { label: "Ấn bản Anh/Việt", href: "/#translated-editions" },
          { label: "Ưu đãi hiện có", href: "/#offers" },
        ],
      },
      {
        title: "Hỗ trợ",
        links: [
          { label: "Liên hệ hỗ trợ", href: "/contact" },
          { label: "Chính sách giao hàng", href: "/shipping" },
          { label: "Chính sách thanh toán", href: "/payment" },
          { label: "Chính sách đổi trả", href: "/returns" },
          { label: "Tra cứu đơn hàng", href: "/orders/track" },
          { label: "Tài khoản", href: "/account" },
        ],
      },
      {
        title: "Chính sách",
        links: [
          { label: "Quyền riêng tư", href: "/privacy" },
          { label: "Điều khoản dịch vụ", href: "/terms" },
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
