type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Expired authorization does not establish whether an earlier attempt committed.
export const isDefinitiveOperationRejection = (status: number) => [400, 404, 409, 422].includes(status);

// Keep only operation keys, never account snapshots or payment details. A lost
// response can be retried after navigation/reload without a second financial entry.
export function createOperationKeys(storage: StorageLike, uuid = () => crypto.randomUUID()) {
  const memory = new Map<string, string>();
  return {
    get(fingerprint: string) {
      const name = `mycoo.partner.operation.${fingerprint}`;
      let key = memory.get(name);
      try { key ??= storage.getItem(name) ?? undefined; } catch { /* Memory fallback. */ }
      if (!key) key = uuid();
      memory.set(name, key);
      try { storage.setItem(name, key); } catch { /* Memory fallback. */ }
      return key;
    },
    complete(fingerprint: string) {
      const name = `mycoo.partner.operation.${fingerprint}`;
      memory.delete(name);
      try { storage.removeItem(name); } catch { /* Memory fallback. */ }
    },
  };
}
