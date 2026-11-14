import type { ProductInput } from '@/lib/types';
import { isRecord } from '@/lib/api';

export function isUploadedImagePath(value: unknown): value is string {
  return typeof value === 'string' && /^\/api\/uploads\/[0-9a-f-]+\.(?:png|jpg|webp)$/.test(value);
}

export function isProductInput(value: unknown): value is ProductInput {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.description !== 'string' ||
    !(value.imageUrl === null || isUploadedImagePath(value.imageUrl)) ||
    !Array.isArray(value.specifications) ||
    typeof value.categoryId !== 'string'
  ) return false;

  const specifications = value.specifications;
  if (specifications.length > 30) return false;
  const specificationNames = new Set<string>();
  for (const specification of specifications) {
    if (
      !isRecord(specification) ||
      typeof specification.property !== 'string' ||
      typeof specification.value !== 'string' ||
      specification.property.trim().length < 1 ||
      specification.property.length > 80 ||
      specification.value.trim().length < 1 ||
      specification.value.length > 240
    ) return false;
    const propertyName = specification.property.trim().toLowerCase();
    if (specificationNames.has(propertyName)) return false;
    specificationNames.add(propertyName);
  }

  return value.name.trim().length >= 2 &&
    value.name.length <= 120 &&
    value.model.trim().length > 0 &&
    value.model.length <= 120 &&
    value.description.length <= 1000 &&
    value.categoryId.length > 0;
}
