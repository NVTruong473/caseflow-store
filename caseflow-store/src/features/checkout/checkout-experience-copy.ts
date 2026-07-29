import { storefrontConfig } from "@/config/storefront";

export const checkoutExperienceCopy = {
  en: {
    accountName: "Recipient",
    accountNumber: "Experience account",
    amount: "Exact experience amount",
    amountStep: "Enter the exact amount shown here on the phone.",
    bank: "Transfer environment",
    cancelledDescription:
      "This session was closed without creating an order or payment.",
    codeStep: "Enter the six-digit confirmation code from this screen.",
    confirmationCode: "Confirmation code",
    continueOfficial: "Continue to official checkout",
    continueOfficialDescription:
      "Your cart is unchanged. Place an official order when you are ready to buy.",
    create: "Create phone QR",
    createDescription:
      "Scan on a phone to practise a bank-transfer confirmation. The server fixes the amount and this flow never creates an order or payment.",
    createError: "The QR experience could not be created. Please try again.",
    createTitle: "Practise the transfer on your phone",
    disclaimer:
      "Experience only. Do not transfer real money. Completion is not proof of payment.",
    modeExperienceDescription:
      "Scan a safe QR and practise the transfer steps without creating an order.",
    modeExperienceLabel: "QR experience",
    modeOfficialDescription:
      "Create an order using the current shipping, voucher, and payment workflow.",
    modeOfficialLabel: "Place order",
    modeTitle: "Choose checkout mode",
    openOnDevice: "Open the phone experience in this browser",
    pending: "Waiting for phone confirmation",
    pendingDescription:
      "Keep this screen open. It updates automatically after the phone confirms the experience.",
    pollingError:
      "The latest status could not be checked. Automatic checking will retry.",
    qrAlt: `Phone transfer experience QR for ${storefrontConfig.name}`,
    qrError: "The experience QR could not be generated.",
    qrLabel: "EXPERIENCE QR - NOT A PAYMENT CODE",
    reset: "Close and create another QR",
    scanStep: "Scan the QR with the phone camera.",
    statusDescriptions: {
      cancelled:
        "This session was closed without creating an order or payment.",
      completed:
        "The phone confirmation matched. No order, payment, stock, voucher, or sales record was created.",
      expired:
        "This QR can no longer be used. Create another session to continue.",
      locked:
        "Too many confirmation attempts were incorrect. Create another session.",
      pending:
        "Keep this screen open. It updates automatically after the phone confirms the experience.",
    },
    statusTitles: {
      cancelled: "Experience closed",
      completed: "Transfer experience completed",
      expired: "Experience QR expired",
      locked: "Experience session locked",
      pending: "Waiting for phone confirmation",
    },
    timeLeft: "Time left",
    transferContent: "Transfer content",
    validatedCart:
      "The final experience amount is recalculated by the server. Discounts are not consumed.",
  },
  vi: {
    accountName: "Người nhận",
    accountNumber: "Tài khoản trải nghiệm",
    amount: "Số tiền trải nghiệm chính xác",
    amountStep: "Nhập đúng số tiền đang hiển thị vào trang trên điện thoại.",
    bank: "Môi trường chuyển khoản",
    cancelledDescription:
      "Phiên đã đóng và không tạo đơn hàng hoặc giao dịch thanh toán.",
    codeStep: "Nhập mã xác nhận sáu số đang hiển thị trên màn hình này.",
    confirmationCode: "Mã xác nhận",
    continueOfficial: "Tiếp tục đặt hàng chính thức",
    continueOfficialDescription:
      "Giỏ hàng vẫn được giữ nguyên. Hãy đặt đơn chính thức khi bạn đã sẵn sàng mua.",
    create: "Tạo QR cho điện thoại",
    createDescription:
      "Quét bằng điện thoại để thực hành bước xác nhận chuyển khoản. Server cố định số tiền và luồng này không tạo đơn hàng hoặc thanh toán.",
    createError: "Không thể tạo phiên QR trải nghiệm. Hãy thử lại.",
    createTitle: "Thực hành chuyển khoản trên điện thoại",
    disclaimer:
      "Chỉ để trải nghiệm. Không chuyển tiền thật. Hoàn tất ở đây không phải xác nhận thanh toán.",
    modeExperienceDescription:
      "Quét QR an toàn và thực hành quy trình chuyển khoản mà không tạo đơn hàng.",
    modeExperienceLabel: "Trải nghiệm QR",
    modeOfficialDescription:
      "Tạo đơn bằng luồng giao hàng, voucher và phương thức thanh toán hiện tại.",
    modeOfficialLabel: "Đặt hàng",
    modeTitle: "Chọn chế độ thanh toán",
    openOnDevice: "Mở trang trải nghiệm ngay trên trình duyệt này",
    pending: "Đang chờ điện thoại xác nhận",
    pendingDescription:
      "Giữ màn hình này mở. Trạng thái sẽ tự cập nhật sau khi điện thoại xác nhận.",
    pollingError:
      "Chưa thể kiểm tra trạng thái mới nhất. Hệ thống sẽ tự thử lại.",
    qrAlt: `QR trải nghiệm chuyển khoản trên điện thoại cho ${storefrontConfig.name}`,
    qrError: "Không thể tạo QR trải nghiệm.",
    qrLabel: "QR TRẢI NGHIỆM - KHÔNG PHẢI MÃ THANH TOÁN",
    reset: "Đóng và tạo QR khác",
    scanStep: "Dùng camera điện thoại quét QR.",
    statusDescriptions: {
      cancelled:
        "Phiên đã đóng và không tạo đơn hàng hoặc giao dịch thanh toán.",
      completed:
        "Điện thoại đã xác nhận đúng. Hệ thống không tạo đơn, thanh toán, trừ tồn kho, dùng voucher hay ghi nhận doanh số.",
      expired: "QR này không còn hiệu lực. Hãy tạo phiên mới để tiếp tục.",
      locked:
        "Đã nhập sai thông tin quá số lần cho phép. Hãy tạo phiên mới.",
      pending:
        "Giữ màn hình này mở. Trạng thái sẽ tự cập nhật sau khi điện thoại xác nhận.",
    },
    statusTitles: {
      cancelled: "Đã đóng phiên trải nghiệm",
      completed: "Đã hoàn tất trải nghiệm chuyển khoản",
      expired: "QR trải nghiệm đã hết hạn",
      locked: "Phiên trải nghiệm đã bị khóa",
      pending: "Đang chờ điện thoại xác nhận",
    },
    timeLeft: "Thời gian còn lại",
    transferContent: "Nội dung chuyển khoản",
    validatedCart:
      "Server sẽ tính lại số tiền trải nghiệm cuối cùng. Voucher không bị sử dụng.",
  },
} as const;
