export function nextUserCode(role, users) {
  const prefix = role === "owner" ? "OWN" : "EMP";
  const count = users.filter((user) => user.role === role).length + 1;

  return `${prefix}${String(count).padStart(3, "0")}`;
}
