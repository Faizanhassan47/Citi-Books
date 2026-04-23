import bcrypt from "bcryptjs";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isPasswordHash(value = "") {
  return typeof value === "string" && BCRYPT_HASH_PATTERN.test(value);
}

export function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    return password;
  }

  return isPasswordHash(password) ? password : bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, storedPassword) {
  if (typeof password !== "string" || typeof storedPassword !== "string" || storedPassword.length === 0) {
    return false;
  }

  return isPasswordHash(storedPassword)
    ? bcrypt.compareSync(password, storedPassword)
    : password === storedPassword;
}

export function normalizeUserPasswords(users) {
  let changed = false;

  for (const user of users) {
    const hashedPassword = hashPassword(user.password);

    if (hashedPassword && hashedPassword !== user.password) {
      user.password = hashedPassword;
      changed = true;
    }
  }

  return changed;
}
