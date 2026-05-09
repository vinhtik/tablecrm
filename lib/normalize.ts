import type { ApiEntity, ID, Product } from "@/lib/types";

export function getEntityId(entity: ApiEntity): ID | null {
  return entity.id ?? entity.uuid ?? entity.guid ?? null;
}

export function getEntityName(entity: ApiEntity): string {
  const id = getEntityId(entity);

  return (
    entity.name ??
    entity.title ??
    entity.label ??
    (id !== null ? String(id) : "Без названия")
  );
}

export function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const objectData = data as Record<string, unknown>;

    const possibleKeys = [
      "data",
      "items",
      "results",
      "result",
      "rows",
      "records"
    ];

    for (const key of possibleKeys) {
      const value = objectData[key];

      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
}

export function getProductPrice(product: Product): number {
  const price =
    product.price ?? product.sale_price ?? product.retail_price ?? 0;

  return Number(price) || 0;
}