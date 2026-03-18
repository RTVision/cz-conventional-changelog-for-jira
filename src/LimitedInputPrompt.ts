import { styleText } from 'node:util';
import InputPrompt from 'inquirer/lib/prompts/input.js';

type InputPromptInstance = new (...args: any[]) => {
  opt: {
    message: string;
    maxLength?: number;
    leadingLabel?: string | ((answers: Record<string, unknown>) => string);
  };
  answers: Record<string, unknown>;
  originalMessage: string;
  throwParamError(name: string): void;
  rl: {
    line: string;
    cursor: number;
  };
  status: string;
  answer: string;
  screen: {
    render(message: string, bottomContent: string): void;
  };
  getQuestion(): string;
};

const InputPromptBase = InputPrompt as unknown as InputPromptInstance;

export default class LimitedInputPrompt extends InputPromptBase {
  declare originalMessage: string;
  declare spacer: string;
  declare leadingLabel: string;
  declare leadingLength: number;

  constructor(...args: any[]) {
    super(...args);

    if (!this.opt.maxLength) {
      this.throwParamError('maxLength');
    }

    this.originalMessage = this.opt.message;
    this.spacer = new Array(this.opt.maxLength).fill('-').join('');

    if (this.opt.leadingLabel) {
      this.leadingLabel =
        typeof this.opt.leadingLabel === 'function'
          ? ` ${this.opt.leadingLabel(this.answers)}`
          : ` ${this.opt.leadingLabel}`;
    } else {
      this.leadingLabel = '';
    }

    this.leadingLength = this.leadingLabel.length;
  }

  remainingChar(): number {
    return (this.opt.maxLength ?? 0) - this.leadingLength - this.rl.line.length;
  }

  onKeypress(): void {
    const maxLength = (this.opt.maxLength ?? 0) - this.leadingLength;

    if (this.rl.line.length > maxLength) {
      this.rl.line = this.rl.line.slice(0, maxLength);
      this.rl.cursor -= 1;
    }

    this.render();
  }

  getCharsLeftText(): string {
    const chars = this.remainingChar();

    if (chars > 15) {
      return styleText('green', `${chars} chars left`);
    }

    if (chars > 5) {
      return styleText('yellow', `${chars} chars left`);
    }

    return styleText('red', `${chars} chars left`);
  }

  render(error?: string): void {
    let bottomContent = '';
    const appendContent =
      this.status === 'answered' ? this.answer : this.rl.line;
    const message = `${this.getQuestion()}\n  [${this.spacer}] ${this.getCharsLeftText()}\n  ${this.leadingLabel} ${appendContent}`;

    if (error) {
      bottomContent = `${styleText('red', '>> ')}${error}`;
    }

    this.screen.render(message, bottomContent);
  }
}
