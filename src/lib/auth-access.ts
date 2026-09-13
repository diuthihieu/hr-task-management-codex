export function isEmailAllowed(email: string | null | undefined, emailList = "", domainList = "") {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowedEmails = splitList(emailList).map((value) => value.toLowerCase());
  const allowedDomains = splitList(domainList).map((value) => value.replace(/^@/, "").toLowerCase());
  if (!allowedEmails.length && !allowedDomains.length) return true;
  return allowedEmails.includes(normalized) || allowedDomains.some((domain) => normalized.endsWith(`@${domain}`));
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

