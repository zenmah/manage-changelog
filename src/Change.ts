export interface IChange {
  version_type: string | undefined;
  type: string | undefined;
  category: string | undefined;
  message: string | undefined;
  isValid(): boolean;
  toString(): string;
}
export class Change implements IChange {
  version_type: string | undefined;
  type: string | undefined;
  category: string | undefined;
  message: string | undefined;

  isValid(): boolean {
    if (this.version_type && this.type && this.category && this.type) {
      return true;
    } else {
      return false;
    }
  }
  toString(): string {
    return `${this.version_type}-${this.category}-${this.type}:${this.message}`;
  }
}
