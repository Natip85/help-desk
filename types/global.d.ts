declare global {
  /**
   * Ensures that a tuple/array `T` contains all members of union `U`.
   */
  type EnsureAll<U, T extends readonly U[]> =
    T[number] extends U ?
    U extends T[number] ?
    T
    : never
    : never;

  /**
   * Helper function to enforce exhaustive lists.
   */
  function makeExhaustiveList<U>(): <T extends readonly U[]>(arr: T & EnsureAll<U, T>) => T;

  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {};
}

// Asset type declarations
declare module "*.svg" {
  import { FC, SVGProps } from "react";
  const Component: FC<SVGProps<SVGSVGElement>>;
  export default Component;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

export { };
