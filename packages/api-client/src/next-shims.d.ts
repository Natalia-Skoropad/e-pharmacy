declare module 'next/server' {
  export type NextRequest = Request & {
    nextUrl: URL;
    cookies: {
      get(name: string): { value: string } | undefined;
    };
  };

  export class NextResponse extends Response {
    cookies: {
      set(
        name: string,
        value: string,
        options?: {
          httpOnly?: boolean;
          path?: string;
          maxAge?: number;
          sameSite?: 'lax' | 'strict' | 'none';
          secure?: boolean;
        }
      ): void;
    };
  }
}

declare module 'next/headers' {
  export function cookies(): Promise<{ toString(): string }>;
}
