export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

export function buildSessionUser(user) {
  return {
    id: user.id,
    userCode: user.userCode,
    name: user.name,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    department: user.department || "General"
  };
}
