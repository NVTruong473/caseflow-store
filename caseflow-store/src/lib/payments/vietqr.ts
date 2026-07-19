export type BuildVietQrPayloadInput = {
  accountName: string;
  accountNumber: string;
  amount: number;
  bankBin: string;
  orderCode: string;
};

export function buildVietQrPayload(input: BuildVietQrPayloadInput) {
  // VietQR duoc tao tu cau hinh demo va tong tien server da xac thuc, khong
  // lay so tien, tai khoan ngan hang, hay noi dung chuyen khoan tu frontend.
  const merchantAccountInformation = tlv(
    "38",
    [
      tlv("00", "A000000727"),
      tlv("01", [tlv("00", input.bankBin), tlv("01", input.accountNumber)].join("")),
      tlv("02", "QRIBFTTA"),
    ].join(""),
  );
  const additionalData = tlv("62", tlv("08", input.orderCode));
  const payloadWithoutCrc = [
    tlv("00", "01"),
    tlv("01", "12"),
    merchantAccountInformation,
    tlv("52", "0000"),
    tlv("53", "704"),
    tlv("54", input.amount.toString()),
    tlv("58", "VN"),
    tlv("59", truncateEmvText(input.accountName, 25)),
    tlv("60", "HO CHI MINH"),
    additionalData,
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${calculateCrc16CcittFalse(payloadWithoutCrc)}`;
}

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function truncateEmvText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

export function calculateCrc16CcittFalse(input: string) {
  // CRC phai tinh tren payload server tao ra, khong lay payload tu client.
  let crc = 0xffff;

  for (let index = 0; index < input.length; index += 1) {
    crc ^= input.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc & 0x8000) !== 0
          ? ((crc << 1) ^ 0x1021) & 0xffff
          : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}
