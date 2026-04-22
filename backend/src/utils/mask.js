export function maskPhone(phone) {
  if (!phone || phone.length < 5) {
    return phone;
  }

  return `${phone.slice(0, 2)}******${phone.slice(-3)}`;
}
