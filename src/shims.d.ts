declare module 'commitizen' {
  const commitizen: {
    configLoader?: {
      load(): Record<string, unknown>;
    };
    default?: {
      configLoader?: {
        load(): Record<string, unknown>;
      };
    };
  };

  export default commitizen;
}

declare module 'inquirer/lib/prompts/input.js' {
  export default class InputPrompt {
    constructor(...args: any[]);
  }
}

declare module 'word-wrap' {
  export interface WrapOptions {
    width?: number;
    indent?: string;
    newline?: string;
    escape?: (value: string) => string;
    trim?: boolean;
    cut?: boolean;
  }

  export default function wrap(value: string, options?: WrapOptions): string;
}
