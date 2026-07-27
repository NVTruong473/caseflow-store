import type { Language } from "@/lib/i18n/language";

export const CUSTOMER_GUIDANCE_STORAGE_PREFIX =
  "caseflow-books.customer-guidance.v1";

export const customerGuidanceTourIds = [
  "getting-started",
  "cart",
  "checkout",
  "orders",
] as const;

export type CustomerGuidanceTourId =
  (typeof customerGuidanceTourIds)[number];

export type CustomerGuidanceSlide = {
  description: string;
  points: string[];
  title: string;
};

export type CustomerGuidanceTour = {
  intro: string;
  slides: CustomerGuidanceSlide[];
  title: string;
};

export const customerGuidanceCopy: Record<
  Language,
  {
    close: string;
    dialogLabel: string;
    next: string;
    openGuide: string;
    previous: string;
    progress: (current: number, total: number) => string;
    understood: string;
    tours: Record<CustomerGuidanceTourId, CustomerGuidanceTour>;
  }
> = {
  en: {
    close: "Close guide",
    dialogLabel: "Customer guide",
    next: "Next",
    openGuide: "View guide",
    previous: "Previous",
    progress: (current, total) => `Step ${current} of ${total}`,
    understood: "Understood",
    tours: {
      "getting-started": {
        title: "How to buy from start to finish",
        intro:
          "Follow the same path the store uses from finding an edition to reviewing an order.",
        slides: [
          {
            title: "Find the right edition",
            description:
              "Search by title, author, or ISBN, then use catalog filters to narrow language, format, category, price, and availability.",
            points: [
              "English and Vietnamese editions are separate products.",
              "Open a book page to compare edition details, price, and stock.",
            ],
          },
          {
            title: "Choose quantity and add to cart",
            description:
              "On the book page, select a quantity within current stock and add that exact edition to the cart.",
            points: [
              "The cart stores edition IDs and quantities on this browser.",
              "Price and stock are checked again before checkout.",
            ],
          },
          {
            title: "Review the cart",
            description:
              "Open Cart from the header to change quantity, remove one edition, clear the cart, continue shopping, or begin checkout.",
            points: [
              "Removing one item does not affect the other cart lines.",
              "Clear cart removes every current cart line.",
            ],
          },
          {
            title: "Choose a checkout path",
            description:
              "Official checkout records an order. QR Experience lets you inspect the QR flow without creating an order or changing inventory.",
            points: [
              "Official checkout uses your profile, delivery choice, payment choice, and one eligible voucher.",
              "The experience path is isolated from business records.",
            ],
          },
          {
            title: "Review the order after submission",
            description:
              "Keep the order code and open Order history from your account to see order and payment status.",
            points: [
              "Eligible early-stage orders expose a Cancel order action.",
              "Orders already paid or far into processing cannot be self-cancelled.",
            ],
          },
        ],
      },
      cart: {
        title: "Using your cart",
        intro:
          "The cart keeps book editions separate and checks current catalog data before checkout.",
        slides: [
          {
            title: "Adjust quantity",
            description:
              "Use minus and plus on each line. The plus button stops at current stock, and checkout validates stock again.",
            points: [
              "Quantity changes apply only to the selected edition.",
              "A stock warning must be resolved before checkout.",
            ],
          },
          {
            title: "Remove one item",
            description:
              "Select Remove on an edition line to delete only that book from the cart.",
            points: [
              "Other editions remain in the cart.",
              "You can add the removed edition again from its book page.",
            ],
          },
          {
            title: "Clear the entire cart",
            description:
              "Clear cart removes all current cart lines from this browser.",
            points: [
              "Use this only when you want to start the selection again.",
              "The cart becomes empty immediately.",
            ],
          },
          {
            title: "Continue or checkout",
            description:
              "Continue shopping closes the drawer without changing items. Checkout opens the account-gated checkout page.",
            points: [
              "You can reopen the cart from the header at any time.",
              "Checkout recalculates trusted totals on the server.",
            ],
          },
        ],
      },
      checkout: {
        title: "Choosing the right checkout mode",
        intro:
          "Official checkout and QR Experience serve different purposes and do not write the same data.",
        slides: [
          {
            title: "Official checkout creates an order",
            description:
              "Use Official checkout when you want the order to appear in account history and store operations.",
            points: [
              "Confirm profile, contact, delivery, and payment information.",
              "Apply no more than one eligible voucher to the order.",
            ],
          },
          {
            title: "Review the final total",
            description:
              "The server checks price and stock, then calculates discount, VAT estimate, delivery, payment fee, and final VND total.",
            points: [
              "Browser values are not trusted as the final price.",
              "Review the order summary before selecting Place order.",
            ],
          },
          {
            title: "QR Experience does not create an order",
            description:
              "Use QR Experience to inspect QR generation, countdown, and simulated completion without affecting store data.",
            points: [
              "It does not consume a voucher or reduce stock.",
              "It does not appear in order history or sales reporting.",
            ],
          },
          {
            title: "After official submission",
            description:
              "The success page shows the order code, order status, payment status, total, and purchased items.",
            points: [
              "Open Order history to review the record later.",
              "Do not repeat submission while the current request is processing.",
            ],
          },
        ],
      },
      orders: {
        title: "Reviewing and cancelling orders",
        intro:
          "Order history separates fulfillment progress from payment progress so each state stays clear.",
        slides: [
          {
            title: "Read both statuses",
            description:
              "Order status describes bookstore processing. Payment status describes whether payment is pending, confirmed, cancelled, failed, or expired.",
            points: [
              "A cancelled order should also show a cancelled payment state.",
              "The order code identifies the record when contacting support.",
            ],
          },
          {
            title: "Open order details",
            description:
              "Expand Order details to review product names, quantities, and line totals captured with the order.",
            points: [
              "Order history is scoped to the signed-in customer.",
              "Another customer cannot open this account history.",
            ],
          },
          {
            title: "Cancel an eligible order",
            description:
              "Use Cancel order only while the action is visible on an early-stage order.",
            points: [
              "Pending or confirmed orders may be eligible before payment or fulfillment advances.",
              "The server rechecks ownership and status before cancellation.",
            ],
          },
          {
            title: "When cancellation is unavailable",
            description:
              "An order already paid or too far into processing cannot be cancelled through self-service.",
            points: [
              "The page explains when self-service cancellation is unavailable.",
              "Use the support page for cases that require store review.",
            ],
          },
        ],
      },
    },
  },
  vi: {
    close: "Đóng hướng dẫn",
    dialogLabel: "Hướng dẫn khách hàng",
    next: "Tiếp theo",
    openGuide: "Xem hướng dẫn",
    previous: "Quay lại",
    progress: (current, total) => `Bước ${current}/${total}`,
    understood: "Đã hiểu",
    tours: {
      "getting-started": {
        title: "Mua hàng từ đầu đến cuối",
        intro:
          "Đi theo đúng luồng của nhà sách, từ tìm ấn bản đến kiểm tra đơn hàng sau khi đặt.",
        slides: [
          {
            title: "Tìm đúng ấn bản",
            description:
              "Tìm theo tên sách, tác giả hoặc ISBN, rồi dùng bộ lọc catalog để chọn ngôn ngữ, định dạng, danh mục, giá và tình trạng còn hàng.",
            points: [
              "Bản tiếng Anh và bản tiếng Việt là hai sản phẩm riêng.",
              "Mở trang sách để đối chiếu thông tin ấn bản, giá và tồn kho.",
            ],
          },
          {
            title: "Chọn số lượng và thêm vào giỏ",
            description:
              "Tại trang sách, chọn số lượng không vượt tồn kho rồi thêm đúng ấn bản đó vào giỏ hàng.",
            points: [
              "Giỏ hàng lưu mã ấn bản và số lượng trên trình duyệt này.",
              "Giá và tồn kho được kiểm tra lại trước khi thanh toán.",
            ],
          },
          {
            title: "Kiểm tra giỏ hàng",
            description:
              "Mở Giỏ hàng trên header để đổi số lượng, xóa một ấn bản, xóa toàn bộ, tiếp tục mua hoặc sang checkout.",
            points: [
              "Xóa một sản phẩm không ảnh hưởng các dòng còn lại.",
              "Xóa giỏ hàng sẽ bỏ toàn bộ sản phẩm hiện có.",
            ],
          },
          {
            title: "Chọn luồng thanh toán",
            description:
              "Đặt hàng chính thức sẽ ghi nhận đơn. Trải nghiệm QR chỉ cho bạn thử luồng QR mà không tạo đơn hay thay đổi tồn kho.",
            points: [
              "Luồng chính thức dùng hồ sơ, giao hàng, thanh toán và một mã giảm giá hợp lệ.",
              "Luồng trải nghiệm được tách khỏi dữ liệu kinh doanh.",
            ],
          },
          {
            title: "Theo dõi sau khi đặt",
            description:
              "Giữ mã đơn và mở Lịch sử đơn hàng trong tài khoản để xem trạng thái đơn và trạng thái thanh toán.",
            points: [
              "Đơn ở giai đoạn sớm, đủ điều kiện sẽ có nút Hủy đơn.",
              "Đơn đã thanh toán hoặc xử lý quá xa không thể tự hủy.",
            ],
          },
        ],
      },
      cart: {
        title: "Sử dụng giỏ hàng",
        intro:
          "Giỏ hàng tách từng ấn bản và kiểm tra lại dữ liệu catalog hiện tại trước checkout.",
        slides: [
          {
            title: "Điều chỉnh số lượng",
            description:
              "Dùng nút trừ và cộng trên từng dòng. Nút cộng dừng ở mức tồn kho và checkout sẽ kiểm tra kho thêm lần nữa.",
            points: [
              "Số lượng chỉ thay đổi trên ấn bản đang chọn.",
              "Cần xử lý cảnh báo tồn kho trước khi thanh toán.",
            ],
          },
          {
            title: "Xóa một sản phẩm",
            description:
              "Bấm Xóa trên dòng ấn bản để chỉ bỏ cuốn sách đó khỏi giỏ.",
            points: [
              "Các ấn bản khác vẫn được giữ nguyên.",
              "Bạn có thể thêm lại sách từ trang chi tiết.",
            ],
          },
          {
            title: "Xóa toàn bộ giỏ hàng",
            description:
              "Nút Xóa giỏ hàng bỏ toàn bộ sản phẩm hiện có trên trình duyệt này.",
            points: [
              "Chỉ dùng khi bạn muốn chọn lại từ đầu.",
              "Giỏ hàng sẽ chuyển sang trạng thái trống ngay.",
            ],
          },
          {
            title: "Tiếp tục mua hoặc thanh toán",
            description:
              "Tiếp tục mua sách sẽ đóng giỏ mà không đổi sản phẩm. Thanh toán sẽ mở trang checkout yêu cầu tài khoản.",
            points: [
              "Bạn có thể mở lại giỏ từ header bất cứ lúc nào.",
              "Checkout tính lại tổng tiền đáng tin cậy ở server.",
            ],
          },
        ],
      },
      checkout: {
        title: "Chọn đúng chế độ thanh toán",
        intro:
          "Đặt hàng chính thức và Trải nghiệm QR phục vụ hai mục đích khác nhau, không ghi cùng một loại dữ liệu.",
        slides: [
          {
            title: "Đặt hàng chính thức sẽ tạo đơn",
            description:
              "Dùng chế độ chính thức khi bạn muốn đơn xuất hiện trong lịch sử tài khoản và khu vực vận hành cửa hàng.",
            points: [
              "Xác nhận hồ sơ, liên hệ, giao hàng và phương thức thanh toán.",
              "Mỗi đơn chỉ áp dụng tối đa một mã giảm giá hợp lệ.",
            ],
          },
          {
            title: "Kiểm tra tổng tiền cuối cùng",
            description:
              "Server kiểm tra giá và tồn kho, rồi tính giảm giá, VAT ước tính, giao hàng, phí thanh toán và tổng VND.",
            points: [
              "Giá trị từ trình duyệt không phải nguồn giá cuối cùng.",
              "Kiểm tra tóm tắt đơn trước khi bấm Đặt đơn.",
            ],
          },
          {
            title: "Trải nghiệm QR không tạo đơn",
            description:
          "Dùng Trải nghiệm QR để xem tạo mã, đếm ngược và hoàn tất quy trình mà không ảnh hưởng dữ liệu cửa hàng.",
            points: [
              "Không dùng mã giảm giá và không trừ tồn kho.",
              "Không xuất hiện trong lịch sử đơn hay báo cáo doanh số.",
            ],
          },
          {
            title: "Sau khi đặt đơn chính thức",
            description:
              "Trang thành công hiển thị mã đơn, trạng thái đơn, trạng thái thanh toán, tổng tiền và sản phẩm đã mua.",
            points: [
              "Mở Lịch sử đơn hàng để xem lại sau.",
              "Không gửi lại khi yêu cầu hiện tại vẫn đang xử lý.",
            ],
          },
        ],
      },
      orders: {
        title: "Xem và hủy đơn hàng",
        intro:
          "Lịch sử đơn tách tiến độ xử lý khỏi tiến độ thanh toán để từng trạng thái luôn rõ ràng.",
        slides: [
          {
            title: "Đọc cả hai trạng thái",
            description:
              "Trạng thái đơn mô tả tiến độ nhà sách. Trạng thái thanh toán cho biết đang chờ, đã xác nhận, đã hủy, thất bại hoặc hết hạn.",
            points: [
              "Đơn đã hủy cũng phải hiển thị thanh toán đã hủy.",
              "Mã đơn dùng để xác định giao dịch khi cần hỗ trợ.",
            ],
          },
          {
            title: "Mở chi tiết đơn",
            description:
              "Mở Chi tiết đơn để xem tên sản phẩm, số lượng và thành tiền đã được lưu cùng đơn.",
            points: [
              "Lịch sử chỉ thuộc tài khoản khách hàng đang đăng nhập.",
              "Khách hàng khác không thể mở lịch sử tài khoản này.",
            ],
          },
          {
            title: "Hủy đơn đủ điều kiện",
            description:
              "Chỉ bấm Hủy đơn khi nút này đang xuất hiện trên đơn ở giai đoạn sớm.",
            points: [
              "Đơn đang chờ hoặc đã xác nhận có thể đủ điều kiện trước khi thanh toán hay xử lý tiến xa.",
              "Server kiểm tra lại chủ sở hữu và trạng thái trước khi hủy.",
            ],
          },
          {
            title: "Khi không thể tự hủy",
            description:
              "Đơn đã thanh toán hoặc xử lý quá xa sẽ không cho hủy trực tiếp trong tài khoản.",
            points: [
              "Trang sẽ giải thích khi tính năng tự hủy không còn khả dụng.",
              "Dùng trang hỗ trợ cho trường hợp cần nhà sách xem xét.",
            ],
          },
        ],
      },
    },
  },
};

export function isCustomerGuidanceTourId(
  value: unknown,
): value is CustomerGuidanceTourId {
  return customerGuidanceTourIds.includes(
    value as CustomerGuidanceTourId,
  );
}
