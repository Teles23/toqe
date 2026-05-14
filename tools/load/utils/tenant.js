export function tenantHeaders(token, barCodigo) {
  return {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": String(barCodigo),
    "Content-Type": "application/json",
  };
}
