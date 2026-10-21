/** Customer name / phone are optional. Empty values are shown with these labels. */
export const UNKNOWN_CUSTOMER_EN = "Unknown customer";
export const UNKNOWN_PHONE_EN = "Not given";

export function customerLabel(name: string | null | undefined, unknown = UNKNOWN_CUSTOMER_EN) {
  return name?.trim() || unknown;
}

export function phoneLabel(phone: string | null | undefined, unknown = UNKNOWN_PHONE_EN) {
  return phone?.trim() || unknown;
}
