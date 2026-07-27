import { storefrontConfig } from "@/config/storefront";

export const checkoutExperienceCopy = {
  en: {
    accountName: "Recipient",
    accountNumber: "Experience account",
    amount: "Experience amount",
    bank: "Internal QR environment",
    bankValue: "CaseFlow Experience",
    completedDescription:
      "The interaction is complete. No order, payment, stock, voucher, or sales record was created.",
    completedTitle: "Transfer experience completed",
    create: "Create experience QR",
    createDescription:
      "The QR uses the current server-validated cart estimate but cannot open a bank or wallet app.",
    createTitle: "Generate a safe QR experience",
    disclaimer:
      "Experience only. Do not transfer real money. Completion is not proof of payment.",
    expired: "Experience QR expired",
    modeExperienceDescription:
      "Generate a safe QR and practise the transfer steps without creating an order.",
    modeExperienceLabel: "QR experience",
    modeOfficialDescription:
      "Create an order using the current shipping, voucher, and payment workflow.",
    modeOfficialLabel: "Place order",
    modeTitle: "Choose checkout mode",
    pending: "Waiting for the transfer experience",
    qrAlt: `Experience QR for ${storefrontConfig.name}`,
    qrError: "The experience QR could not be generated.",
    qrLabel: "EXPERIENCE QR - NOT A PAYMENT CODE",
    reset: "Start again",
    simulate: "Complete experience",
    simulating: "Completing experience",
    timeLeft: "Time left",
    transferContent: "Transfer content",
    validatedCart:
      "Amount based on the latest server-validated cart. Discounts are not consumed.",
  },
  vi: {
    accountName: "Người nhận",
    accountNumber: "Tài khoản trải nghiệm",
    amount: "Số tiền trải nghiệm",
    bank: "Môi trường QR nội bộ",
    bankValue: "CaseFlow Experience",
    completedDescription:
      "Tương tác đã hoàn tất. Hệ thống không tạo đơn, thanh toán, trừ tồn kho, dùng voucher hay ghi nhận doanh số.",
    completedTitle: "Đã hoàn tất trải nghiệm chuyển khoản",
    create: "Tạo QR trải nghiệm",
    createDescription:
      "QR dùng số tiền ước tính từ giỏ hàng đã được server kiểm tra nhưng không thể mở ứng dụng ngân hàng hoặc ví.",
    createTitle: "Tạo trải nghiệm QR an toàn",
    disclaimer:
      "Chỉ để trải nghiệm. Không chuyển tiền thật. Hoàn tất ở đây không phải xác nhận thanh toán.",
    expired: "QR trải nghiệm đã hết hạn",
    modeExperienceDescription:
      "Tạo QR an toàn và thực hành quy trình chuyển khoản mà không tạo đơn hàng.",
    modeExperienceLabel: "Trải nghiệm QR",
    modeOfficialDescription:
      "Tạo đơn bằng luồng giao hàng, voucher và phương thức thanh toán hiện tại.",
    modeOfficialLabel: "Đặt hàng",
    modeTitle: "Chọn chế độ thanh toán",
    pending: "Đang chờ hoàn tất trải nghiệm chuyển khoản",
    qrAlt: `QR trải nghiệm cho ${storefrontConfig.name}`,
    qrError: "Không thể tạo QR trải nghiệm.",
    qrLabel: "QR TRẢI NGHIỆM - KHÔNG PHẢI MÃ THANH TOÁN",
    reset: "Trải nghiệm lại",
    simulate: "Hoàn tất trải nghiệm",
    simulating: "Đang hoàn tất trải nghiệm",
    timeLeft: "Thời gian còn lại",
    transferContent: "Nội dung chuyển khoản",
    validatedCart:
      "Số tiền dựa trên giỏ hàng vừa được server kiểm tra. Voucher không bị sử dụng.",
  },
} as const;
