import { instanceToPlain } from 'class-transformer';

const removeNulls = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null) {
      if (Array.isArray(value)) acc[key] = value.map(removeNulls);
      else acc[key] = value['id'] ? removeNulls(value) : value;
    }
    return acc;
  }, {});
};

export abstract class CustomBaseEntity {
  toJSON() {
    const obj = instanceToPlain(this);
    return removeNulls(obj);
  }
}
