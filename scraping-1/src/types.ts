export interface Painting {
  name: string;
  extensions: string[];
  link: string;
  image: string;
}

export type DeferredImageMap = Record<string, string>;