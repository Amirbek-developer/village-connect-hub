// Phone helpers — normalize to digits, build pseudo-email so we can use
// email/password auth without SMS/OTP while still keying users by phone.

export function digits(input: string): string {
  return (input || "").replace(/\D+/g, "");
}

/** Normalize to canonical Uzbek format: 12 digits starting with 998. */
export function normalizePhone(input: string): string {
  let d = digits(input);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = "998" + d;            // 90 123 45 67 -> 998901234567
  if (d.length === 12 && d.startsWith("998")) return d;
  return d;
}

export function isValidUzPhone(input: string): boolean {
  const n = normalizePhone(input);
  return /^998\d{9}$/.test(n);
}

export function formatPhone(input: string): string {
  const n = normalizePhone(input);
  if (n.length !== 12) return input;
  return `+${n.slice(0,3)} ${n.slice(3,5)} ${n.slice(5,8)} ${n.slice(8,10)} ${n.slice(10,12)}`;
}

/** Format phone as user types, always keeping +998 prefix: "+998 94 623 07 10" */
export function formatPhoneInput(input: string): string {
  let d = digits(input);
  if (d.startsWith("998")) d = d.slice(3);
  if (d.startsWith("00998")) d = d.slice(5);
  d = d.slice(0, 9);
  let out = "+998";
  if (d.length > 0) out += " " + d.slice(0, 2);
  if (d.length > 2) out += " " + d.slice(2, 5);
  if (d.length > 5) out += " " + d.slice(5, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  return out;
}

/** Stable pseudo-email used as the Supabase auth identifier. */
export function phoneToEmail(input: string): string {
  return `${normalizePhone(input)}@qishloqnet.app`;
}

export const LAST_PHONE_KEY = "qn_last_phone";
export const VISITED_KEY = "qn_visited";
