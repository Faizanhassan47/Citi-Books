export const shareOnWhatsApp = (phone, text) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
