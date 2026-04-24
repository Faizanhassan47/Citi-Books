export const shareOnWhatsApp = (phone, text) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const url = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  
  // Using location.assign is more robust than window.open which is often blocked
  window.location.assign(url);
};
