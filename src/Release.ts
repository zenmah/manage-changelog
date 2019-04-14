export interface IRelease {
    setRelease(major: number, minor: number, patch: string): any;
    increaseMinor(): void;
    increaseMajor(): void;
    toString(): string;
    major: number;
    minor: number;
    patch: string;
}
export class Release implements IRelease {
    constructor() {
        this.major = 0;
        this.minor = 0;
        this.patch = "";
    }

    increaseMinor(): void {
        this.minor++;
    }
    increaseMajor(): void {
        this.major++;
    }
    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
    setRelease(major: number, minor: number, patch: string) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    major: number;
    minor: number;
    patch: string;
}
