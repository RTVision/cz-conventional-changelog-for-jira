export interface CommitTypeDefinition {
  description: string;
  title: string;
}

export type CommitTypes = Record<string, CommitTypeDefinition>;

export type JiraLocation =
  | 'pre-type'
  | 'pre-description'
  | 'post-description'
  | 'post-body';

export interface AdapterOptions {
  types: CommitTypes;
  scopes?: string[];
  jiraMode: boolean;
  skipScope: boolean;
  skipType: boolean;
  skipDescription: boolean;
  skipBreaking: boolean;
  customScope: boolean;
  defaultType?: string;
  defaultScope?: string;
  defaultSubject?: string;
  defaultBody?: string;
  defaultIssues?: string;
  maxHeaderWidth: number;
  minHeaderWidth: number;
  maxLineWidth: number;
  jiraOptional: boolean;
  jiraPrefix: string;
  jiraLocation: JiraLocation;
  jiraPrepend: string;
  jiraAppend: string;
  exclamationMark: boolean;
}

export interface CommitizenConfig extends Partial<AdapterOptions> {
  path?: string;
}

export interface PromptAnswers {
  type?: string;
  jira?: string;
  scope?: string;
  customScope?: string;
  subject: string;
  body?: string;
  isBreaking?: boolean;
  breaking?: string;
  breakingBody?: string;
  isIssueAffected?: boolean;
  issuesBody?: string;
  issues?: string;
}

export interface CommitQuestion {
  type: string;
  name: keyof PromptAnswers | 'doCommit';
  message: string | ((answers: PromptAnswers) => string);
  default?: string | boolean;
  choices?: string[] | Array<{ name: string; value: string }>;
  when?: boolean | ((answers: PromptAnswers) => boolean | undefined);
  validate?: (value: string, answers: PromptAnswers) => boolean | string;
  filter?: (value: string) => string;
  maxLength?: number;
  leadingLabel?: string | ((answers: PromptAnswers) => string);
}

export interface CommitizenLike {
  registerPrompt(name: string, prompt: unknown): void;
  prompt<T>(questions: CommitQuestion[]): Promise<T>;
}

export interface CommitizenAdapter {
  prompter(
    cz: CommitizenLike,
    commit: (message: string) => void,
    testMode?: boolean,
  ): void;
}
