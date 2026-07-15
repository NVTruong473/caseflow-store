export const siteNavigation = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#products" },
  { label: "Compatibility", href: "/#compatibility" },
  { label: "Support", href: "/#support" },
] as const;

export const footerNavigation = [
  {
    title: "Shop",
    links: [
      { label: "Featured products", href: "/#products" },
      { label: "Phone cases", href: "/#categories" },
      { label: "Chargers", href: "/#categories" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Order support", href: "/#support" },
      { label: "Compatibility guide", href: "/#compatibility" },
      { label: "Checkout notes", href: "/#checkout" },
    ],
  },
] as const;
