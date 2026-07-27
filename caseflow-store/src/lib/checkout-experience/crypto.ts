import "server-only";

import crypto from "node:crypto";

export function deriveCheckoutExperienceCredentials(input: {
  clientRequestId: string;
  customerId: string;
  secret: string;
}) {
  const scope = `${input.customerId}:${input.clientRequestId}`;
  const accessToken = createHmac(input.secret, `token:v1:${scope}`).toString(
    "base64url",
  );
  const codeBytes = createHmac(input.secret, `code:v1:${scope}`);
  const confirmationCode = (
    100_000 + (codeBytes.readUInt32BE(0) % 900_000)
  ).toString();
  const confirmationCodeSalt = createHmac(
    input.secret,
    `salt:v1:${scope}`,
  ).toString("hex");

  return {
    accessToken,
    confirmationCode,
    confirmationCodeHash: hashCheckoutExperienceConfirmationCode({
      code: confirmationCode,
      salt: confirmationCodeSalt,
    }),
    confirmationCodeSalt,
    tokenHash: hashCheckoutExperienceToken(accessToken),
  };
}

export function hashCheckoutExperienceToken(token: string) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashCheckoutExperienceConfirmationCode(input: {
  code: string;
  salt: string;
}) {
  return crypto
    .createHash("sha256")
    .update(`${input.salt}:${input.code}`, "utf8")
    .digest("hex");
}

export function createCheckoutExperienceCartFingerprint(
  items: Array<{ productId: string; quantity: number }>,
) {
  const canonicalItems = items
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
    .sort((left, right) => left.productId.localeCompare(right.productId));

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalItems), "utf8")
    .digest("hex");
}

function createHmac(secret: string, value: string) {
  return crypto.createHmac("sha256", secret).update(value, "utf8").digest();
}
