import {
  storefrontConfig,
  withStorefrontBrand,
} from "@/config/storefront";
import type { Language } from "@/lib/i18n/language";

export type BookstorePolicySlug =
  | "contact"
  | "payment"
  | "privacy"
  | "returns"
  | "shipping"
  | "terms";

export type BookstorePolicyTone =
  | "arrival"
  | "discovery"
  | "offer"
  | "operations"
  | "translation"
  | "trust";

type PolicyLink = {
  href: string;
  label: string;
};

type PolicySection = {
  body: string;
  title: string;
};

type LocalizedPolicy = {
  badge: string;
  contactRows?: Array<{ label: string; value: string }>;
  cta?: PolicyLink;
  highlights: string[];
  lastUpdated: string;
  lead: string;
  sections: PolicySection[];
  summary: string;
  title: string;
};

export type BookstorePolicy = {
  copy: Record<Language, LocalizedPolicy>;
  path: `/${BookstorePolicySlug}`;
  slug: BookstorePolicySlug;
  tone: BookstorePolicyTone;
};

const referenceBookstorePolicies: BookstorePolicy[] = [
  {
    path: "/contact",
    slug: "contact",
    tone: "trust",
    copy: {
      en: {
        badge: "Bookstore support",
        contactRows: [
          { label: "Support window", value: "Mon-Sat, 09:00-18:00 ICT" },
          { label: "Order help", value: "Use order code plus matching email or phone" },
          { label: "Account help", value: "Keep profile, phone, and default address current" },
        ],
        cta: { href: "/orders/track", label: "Track an order" },
        highlights: [
          "Order lookups require the order code and matching checkout contact.",
          "Account profile details are used to reduce address and contact mistakes.",
          "Payment and delivery corrections should happen before the order is confirmed.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "Use the customer account and order-tracking surfaces as the primary support channels for CaseFlow Books orders.",
        sections: [
          {
            title: "Order support",
            body:
              "Track an order with the order code and the same email or phone used at checkout. This keeps order information tied to the customer contact used for purchase.",
          },
          {
            title: "Before purchase",
            body:
              "Review edition language, format, price, stock, shipping address, and payment choice before confirming the order. Changes are easiest before the order leaves checkout.",
          },
          {
            title: "Account support",
            body:
              "Keep recipient name, phone, and address current in the account profile so checkout and order handling have consistent customer information.",
          },
        ],
        summary:
          "Customer support channels, order lookup requirements, and support hours for CaseFlow Books.",
        title: "Contact CaseFlow Books",
      },
      vi: {
        badge: "Hỗ trợ nhà sách",
        contactRows: [
          { label: "Khung giờ hỗ trợ", value: "Thứ 2-Thứ 7, 09:00-18:00 ICT" },
          { label: "Hỗ trợ đơn hàng", value: "Dùng mã đơn kèm email hoặc số điện thoại trùng lúc đặt" },
          { label: "Hỗ trợ tài khoản", value: "Giữ hồ sơ, số điện thoại và địa chỉ mặc định luôn đúng" },
        ],
        cta: { href: "/orders/track", label: "Tra cứu đơn hàng" },
        highlights: [
          "Tra cứu đơn cần mã đơn và email hoặc số điện thoại trùng với thông tin lúc thanh toán.",
          "Thông tin hồ sơ giúp giảm lỗi địa chỉ và liên hệ khi xử lý đơn.",
          "Điều chỉnh thanh toán hoặc giao hàng nên thực hiện trước khi đơn được xác nhận.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Tài khoản khách hàng và trang tra cứu đơn là hai kênh hỗ trợ chính cho đơn hàng CaseFlow Books.",
        sections: [
          {
            title: "Hỗ trợ đơn hàng",
            body:
              "Tra cứu đơn bằng mã đơn và email hoặc số điện thoại đã dùng khi thanh toán. Cách này giữ thông tin đơn gắn với đúng liên hệ mua hàng.",
          },
          {
            title: "Trước khi mua",
            body:
              "Kiểm tra ngôn ngữ ấn bản, định dạng, giá, tồn kho, địa chỉ nhận hàng và phương thức thanh toán trước khi xác nhận đơn.",
          },
          {
            title: "Hỗ trợ tài khoản",
            body:
              "Cập nhật tên người nhận, số điện thoại và địa chỉ trong hồ sơ để bước thanh toán và xử lý đơn có thông tin nhất quán.",
          },
        ],
        summary:
          "Kênh hỗ trợ khách hàng, điều kiện tra cứu đơn và khung giờ hỗ trợ của CaseFlow Books.",
        title: "Liên hệ CaseFlow Books",
      },
    },
  },
  {
    path: "/shipping",
    slug: "shipping",
    tone: "arrival",
    copy: {
      en: {
        badge: "Delivery policy",
        cta: { href: "/checkout", label: "Review checkout" },
        highlights: [
          "Shipping is calculated from the current cart and delivery address.",
          "Vietnam addresses are prioritized in the storefront flow.",
          "Order status is checked through the order-tracking page.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "Shipping expectations are kept clear before confirmation so customers can review delivery cost and contact details.",
        sections: [
          {
            title: "Shipping scope",
            body:
              "CaseFlow Books prioritizes delivery addresses in Vietnam. Checkout asks for recipient details and recalculates shipping before the order is confirmed.",
          },
          {
            title: "Address quality",
            body:
              "Recipient name, phone number, province, district, ward, and street address should be complete. Ambiguous addresses may require support review before fulfillment.",
          },
          {
            title: "Tracking status",
            body:
              "Customers can follow order, payment, and shipping state from the tracking page by using the order code and matching checkout contact.",
          },
        ],
        summary:
          "Shipping scope, address requirements, and tracking expectations for CaseFlow Books orders.",
        title: "Shipping Policy",
      },
      vi: {
        badge: "Chính sách giao hàng",
        cta: { href: "/checkout", label: "Xem bước thanh toán" },
        highlights: [
          "Phí vận chuyển được tính từ giỏ hàng và địa chỉ giao hàng hiện tại.",
          "Flow mua hàng ưu tiên địa chỉ tại Việt Nam.",
          "Trạng thái đơn được kiểm tra qua trang tra cứu đơn hàng.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Kỳ vọng giao hàng được trình bày rõ trước khi xác nhận để khách kiểm tra phí ship và thông tin liên hệ.",
        sections: [
          {
            title: "Phạm vi giao hàng",
            body:
              "CaseFlow Books ưu tiên địa chỉ giao hàng tại Việt Nam. Checkout yêu cầu thông tin người nhận và tính lại phí vận chuyển trước khi xác nhận đơn.",
          },
          {
            title: "Chất lượng địa chỉ",
            body:
              "Tên người nhận, số điện thoại, tỉnh/thành, quận/huyện, phường/xã và địa chỉ chi tiết cần đầy đủ. Địa chỉ chưa rõ có thể cần hỗ trợ kiểm tra trước khi xử lý.",
          },
          {
            title: "Tra cứu trạng thái",
            body:
              "Khách hàng có thể theo dõi trạng thái đơn, thanh toán và giao hàng bằng mã đơn cùng liên hệ đã dùng lúc thanh toán.",
          },
        ],
        summary:
          "Phạm vi giao hàng, yêu cầu địa chỉ và cách tra cứu trạng thái đơn của CaseFlow Books.",
        title: "Chính sách giao hàng",
      },
    },
  },
  {
    path: "/payment",
    slug: "payment",
    tone: "offer",
    copy: {
      en: {
        badge: "Payment policy",
        cta: { href: "/checkout", label: "Open checkout" },
        highlights: [
          "COD and bank transfer are the primary Vietnam-first choices.",
          "MoMo, ZaloPay, and VNPay-style choices are selected in checkout.",
          "VAT, shipping, payment fee, and FX estimates are recalculated before confirmation.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "Payment choices are presented before confirmation, with VND kept as the source currency for order totals.",
        sections: [
          {
            title: "Accepted choices",
            body:
              "Checkout supports COD, bank transfer, MoMo, ZaloPay, and VNPay-style payment choices. COD and bank transfer are prioritized for Vietnam orders.",
          },
          {
            title: "Total calculation",
            body:
              "Item prices, VAT estimate, shipping fee, payment fee estimate, promotion, and total are recalculated from current catalog and checkout rules before confirmation.",
          },
          {
            title: "International display",
            body:
              "When English is selected, USD estimates can help international customers understand the VND price. Final order totals remain source-priced in VND.",
          },
        ],
        summary:
          "Payment choices, VND totals, VAT/fee estimates, and checkout confirmation rules.",
        title: "Payment Policy",
      },
      vi: {
        badge: "Chính sách thanh toán",
        cta: { href: "/checkout", label: "Mở bước thanh toán" },
        highlights: [
          "COD và chuyển khoản là hai lựa chọn ưu tiên cho đơn tại Việt Nam.",
          "MoMo, ZaloPay và VNPay được chọn trong bước thanh toán.",
          "VAT, phí ship, phí thanh toán và quy đổi ngoại tệ được tính lại trước khi xác nhận.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Phương thức thanh toán được trình bày trước khi xác nhận, trong đó VND là đồng tiền nguồn của tổng đơn.",
        sections: [
          {
            title: "Lựa chọn thanh toán",
            body:
              "Checkout hỗ trợ COD, chuyển khoản, MoMo, ZaloPay và VNPay. COD và chuyển khoản được ưu tiên cho đơn hàng tại Việt Nam.",
          },
          {
            title: "Tính tổng tiền",
            body:
              "Giá sách, VAT ước tính, phí vận chuyển, phí thanh toán ước tính, khuyến mãi và tổng đơn được tính lại từ catalog và quy tắc thanh toán hiện tại trước khi xác nhận.",
          },
          {
            title: "Hiển thị quốc tế",
            body:
              "Khi chọn tiếng Anh, ước tính USD giúp khách quốc tế hiểu giá VND. Tổng đơn cuối cùng vẫn lấy VND làm giá nguồn.",
          },
        ],
        summary:
          "Phương thức thanh toán, tổng tiền VND, VAT/phí ước tính và quy tắc xác nhận đơn.",
        title: "Chính sách thanh toán",
      },
    },
  },
  {
    path: "/returns",
    slug: "returns",
    tone: "translation",
    copy: {
      en: {
        badge: "Returns and replacements",
        cta: { href: "/orders/track", label: "Find your order" },
        highlights: [
          "Return support focuses on damaged, incorrect, or materially mismatched books.",
          "Customers should keep packaging and order information for review.",
          "Edition language and format should be checked before confirmation.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "Return handling is designed around clear order evidence and fair replacement review for book editions.",
        sections: [
          {
            title: "Eligible issues",
            body:
              "Support review applies when a book arrives damaged, materially different from the confirmed edition, or missing expected order items.",
          },
          {
            title: "Customer preparation",
            body:
              "Keep the order code, recipient contact, packaging, and clear condition notes. These details help support review the issue consistently.",
          },
          {
            title: "Edition choice",
            body:
              "Because English and Vietnamese editions can share the same work title, customers should check language, format, publisher, and price before confirming checkout.",
          },
        ],
        summary:
          "Return and replacement review rules for damaged, incorrect, or mismatched book orders.",
        title: "Returns Policy",
      },
      vi: {
        badge: "Đổi trả và thay thế",
        cta: { href: "/orders/track", label: "Tìm đơn hàng" },
        highlights: [
          "Hỗ trợ đổi trả tập trung vào sách hư hỏng, sai ấn bản hoặc khác đáng kể so với đơn.",
          "Khách nên giữ bao bì và thông tin đơn để hỗ trợ kiểm tra.",
          "Ngôn ngữ và định dạng ấn bản cần được kiểm tra trước khi xác nhận.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Quy trình đổi trả dựa trên thông tin đơn rõ ràng và đánh giá công bằng cho từng ấn bản sách.",
        sections: [
          {
            title: "Trường hợp được xem xét",
            body:
              "Hỗ trợ kiểm tra khi sách bị hư hỏng, khác đáng kể với ấn bản đã xác nhận hoặc thiếu sản phẩm trong đơn.",
          },
          {
            title: "Khách hàng cần chuẩn bị",
            body:
              "Giữ mã đơn, liên hệ người nhận, bao bì và ghi chú tình trạng rõ ràng. Những thông tin này giúp hỗ trợ kiểm tra nhất quán.",
          },
          {
            title: "Lựa chọn ấn bản",
            body:
              "Vì bản tiếng Anh và tiếng Việt có thể cùng tên tác phẩm, khách nên kiểm tra ngôn ngữ, định dạng, nhà xuất bản và giá trước khi xác nhận thanh toán.",
          },
        ],
        summary:
          "Quy tắc xem xét đổi trả và thay thế cho đơn sách hư hỏng, sai hoặc khác ấn bản.",
        title: "Chính sách đổi trả",
      },
    },
  },
  {
    path: "/privacy",
    slug: "privacy",
    tone: "operations",
    copy: {
      en: {
        badge: "Customer data",
        cta: { href: "/account", label: "Manage account" },
        highlights: [
          "Account and checkout details are used for order handling.",
          "Public tracking requires both order code and matching contact.",
          "Admin and staff views are role-limited in the application.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "Customer data should support purchase, delivery, account access, and support workflows with clear purpose.",
        sections: [
          {
            title: "Data used for orders",
            body:
              "CaseFlow Books uses account profile, recipient contact, shipping address, cart items, payment choice, and order status for checkout and support workflows.",
          },
          {
            title: "Tracking protection",
            body:
              "Public order tracking requires an order code plus matching email or phone so order information is not opened by code alone.",
          },
          {
            title: "Operational access",
            body:
              "Admin and staff surfaces are separated from customer pages and should be used only for catalog, inventory, customer, promotion, and order operations allowed by role.",
          },
        ],
        summary:
          "How CaseFlow Books uses customer account, checkout, tracking, and operational data.",
        title: "Privacy Policy",
      },
      vi: {
        badge: "Dữ liệu khách hàng",
        cta: { href: "/account", label: "Quản lý tài khoản" },
        highlights: [
          "Thông tin tài khoản và thanh toán được dùng để xử lý đơn.",
          "Tra cứu công khai cần mã đơn và liên hệ trùng khớp.",
          "Trang quản trị và nhân viên được giới hạn theo vai trò trong ứng dụng.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Dữ liệu khách hàng cần phục vụ mua hàng, giao hàng, truy cập tài khoản và hỗ trợ với mục đích rõ ràng.",
        sections: [
          {
            title: "Dữ liệu dùng cho đơn hàng",
            body:
              "CaseFlow Books dùng hồ sơ tài khoản, liên hệ người nhận, địa chỉ giao hàng, sản phẩm trong giỏ, lựa chọn thanh toán và trạng thái đơn cho quy trình thanh toán và hỗ trợ.",
          },
          {
            title: "Bảo vệ tra cứu đơn",
            body:
              "Tra cứu đơn công khai yêu cầu mã đơn cùng email hoặc số điện thoại trùng khớp để thông tin đơn không mở chỉ bằng mã.",
          },
          {
            title: "Truy cập vận hành",
            body:
              "Trang quản trị và nhân viên tách khỏi trang khách hàng và chỉ nên dùng cho catalog, tồn kho, khách hàng, khuyến mãi và đơn hàng theo quyền vai trò.",
          },
        ],
        summary:
          "Cách CaseFlow Books dùng dữ liệu tài khoản, thanh toán, tra cứu và vận hành.",
        title: "Chính sách quyền riêng tư",
      },
    },
  },
  {
    path: "/terms",
    slug: "terms",
    tone: "discovery",
    copy: {
      en: {
        badge: "Store terms",
        cta: { href: "/catalog", label: "Browse catalog" },
        highlights: [
          "Prices, stock, fees, and totals are checked again during checkout.",
          "A customer account is required before order confirmation.",
          "Customers should choose the intended language and format before purchase.",
        ],
        lastUpdated: "19 Jul 2026",
        lead:
          "These terms describe the practical buying rules for using CaseFlow Books as an online bookstore.",
        sections: [
          {
            title: "Catalog accuracy",
            body:
              "Book titles, authors, language, format, publisher, ISBN, price, and stock are shown from the current catalog where available. Optional fields may be omitted when not reviewed.",
          },
          {
            title: "Checkout confirmation",
            body:
              "A customer account and complete delivery/contact details are required before confirming an order. Checkout recalculates totals from trusted catalog and checkout rules.",
          },
          {
            title: "Responsible use",
            body:
              "Customers should use accurate contact details and avoid placing orders they do not intend to receive. Staff may review incomplete or inconsistent order information before fulfillment.",
          },
        ],
        summary:
          "Practical store terms for catalog accuracy, account checkout, and responsible order use.",
        title: "Terms of Service",
      },
      vi: {
        badge: "Điều khoản nhà sách",
        cta: { href: "/catalog", label: "Xem catalog" },
        highlights: [
          "Giá, tồn kho, phí và tổng tiền được kiểm tra lại trong bước thanh toán.",
          "Cần tài khoản khách hàng trước khi xác nhận đơn.",
          "Khách nên chọn đúng ngôn ngữ và định dạng trước khi mua.",
        ],
        lastUpdated: "19/07/2026",
        lead:
          "Các điều khoản này mô tả quy tắc mua hàng thực tế khi sử dụng CaseFlow Books như một nhà sách trực tuyến.",
        sections: [
          {
            title: "Độ chính xác catalog",
            body:
              "Tên sách, tác giả, ngôn ngữ, định dạng, nhà xuất bản, ISBN, giá và tồn kho được hiển thị từ catalog hiện tại khi có dữ liệu. Trường tùy chọn có thể được bỏ qua nếu chưa kiểm chứng.",
          },
          {
            title: "Xác nhận thanh toán",
            body:
              "Cần tài khoản khách hàng và thông tin giao hàng/liên hệ đầy đủ trước khi xác nhận đơn. Bước thanh toán tính lại tổng tiền từ catalog và quy tắc thanh toán đáng tin.",
          },
          {
            title: "Sử dụng có trách nhiệm",
            body:
              "Khách hàng nên dùng thông tin liên hệ chính xác và tránh đặt đơn không có ý định nhận. Nhân viên có thể kiểm tra đơn thiếu hoặc mâu thuẫn thông tin trước khi xử lý.",
          },
        ],
        summary:
          "Điều khoản thực tế về độ chính xác catalog, thanh toán bằng tài khoản và sử dụng đơn hàng có trách nhiệm.",
        title: "Điều khoản dịch vụ",
      },
    },
  },
];

export const bookstorePolicies: BookstorePolicy[] =
  referenceBookstorePolicies.map((policy) => ({
    ...policy,
    copy: {
      en: localizePolicy(policy.copy.en, "en"),
      vi: localizePolicy(policy.copy.vi, "vi"),
    },
  }));

function localizePolicy(copy: LocalizedPolicy, language: Language) {
  return {
    ...copy,
    contactRows: copy.contactRows?.map((row, index) => ({
      label: withStorefrontBrand(row.label),
      value:
        index === 0
          ? storefrontConfig.supportHours[language]
          : withStorefrontBrand(row.value),
    })),
    cta: copy.cta
      ? { ...copy.cta, label: withStorefrontBrand(copy.cta.label) }
      : undefined,
    highlights: copy.highlights.map(withStorefrontBrand),
    lead: withStorefrontBrand(copy.lead),
    sections: copy.sections.map((section) => ({
      body: withStorefrontBrand(section.body),
      title: withStorefrontBrand(section.title),
    })),
    summary: withStorefrontBrand(copy.summary),
    title: withStorefrontBrand(copy.title),
  } satisfies LocalizedPolicy;
}

const policiesBySlug = new Map(
  bookstorePolicies.map((policy) => [policy.slug, policy]),
);

export function getBookstorePolicy(slug: BookstorePolicySlug) {
  const policy = policiesBySlug.get(slug);

  if (!policy) {
    throw new Error(`Unknown bookstore policy: ${slug}`);
  }

  return policy;
}
