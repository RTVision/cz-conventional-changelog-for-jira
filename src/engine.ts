import { execSync } from 'node:child_process';
import { styleText } from 'node:util';

import boxen from 'boxen';
import wrap from 'word-wrap';

import type {
  AdapterOptions,
  CommitQuestion,
  CommitizenAdapter,
  PromptAnswers,
} from '#src/contracts.js';
import defaults from '#src/defaults.js';
import LimitedInputPrompt from '#src/LimitedInputPrompt.js';

const jiraIssueRegex =
  /(?<jiraIssue>(?<!([a-zA-Z0-9]{1,10})-?)[a-zA-Z0-9]+-\d+)/;

function filter(values: Array<string | false | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}

export function filterSubject(subject: string): string {
  let nextSubject = subject.trim();

  while (nextSubject.endsWith('.')) {
    nextSubject = nextSubject.slice(0, -1);
  }

  return nextSubject;
}

export function decorateJiraIssue(
  jiraIssue: string | undefined,
  options: AdapterOptions,
): string {
  const prepend = options.jiraPrepend || '';
  const append = options.jiraAppend || '';

  return jiraIssue ? `${prepend}${jiraIssue}${append} ` : '';
}

export function getJiraIssueLocation(
  location: AdapterOptions['jiraLocation'],
  type = '',
  scope = '',
  jiraWithDecorators = '',
  subject = '',
): string {
  let headerPrefix = `${type}${scope}`;

  if (headerPrefix !== '') {
    headerPrefix += ': ';
  }

  switch (location) {
    case 'pre-type':
      return `${jiraWithDecorators}${headerPrefix}${subject}`;
    case 'pre-description':
      return `${headerPrefix}${jiraWithDecorators}${subject}`;
    case 'post-description':
      return `${headerPrefix}${subject} ${jiraWithDecorators}`;
    case 'post-body':
      return `${headerPrefix}${subject}`;
    default:
      return `${headerPrefix}${jiraWithDecorators}${subject}`;
  }
}

function getCurrentBranchName(): string {
  try {
    return execSync('git branch --show-current', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function getJiraIssueFromBranch(branchName: string): string | undefined {
  const matchResult = branchName.match(jiraIssueRegex);
  return matchResult?.groups?.jiraIssue;
}

function getProvidedScope(answers: PromptAnswers): string | undefined {
  return answers.scope === 'custom' ? answers.customScope : answers.scope;
}

function getFromOptionsOrDefaults<K extends keyof AdapterOptions>(
  options: AdapterOptions,
  key: K,
): AdapterOptions[K] {
  return options[key] ?? defaults[key];
}

export function createQuestions(
  options: AdapterOptions,
  branchName = getCurrentBranchName(),
): CommitQuestion[] {
  const types = getFromOptionsOrDefaults(options, 'types');
  const typeKeys = Object.keys(types);
  const length = Math.max(...typeKeys.map((key) => key.length), 0) + 1;
  const choices = Object.entries(types).map(([key, type]) => ({
    name: `${`${key}:`.padEnd(length)} ${type.description}`,
    value: key,
  }));

  const minHeaderWidth = getFromOptionsOrDefaults(options, 'minHeaderWidth');
  const maxHeaderWidth = getFromOptionsOrDefaults(options, 'maxHeaderWidth');
  const jiraIssue = getJiraIssueFromBranch(branchName);
  const hasScopes = Array.isArray(options.scopes) && options.scopes.length > 0;
  const supportsCustomScope =
    !options.skipScope && hasScopes && options.customScope;
  const scopes = supportsCustomScope
    ? [...(options.scopes ?? []), 'custom']
    : options.scopes;

  return [
    {
      type: 'list',
      name: 'type',
      when: !options.skipType,
      message: "Select the type of change that you're committing:",
      choices,
      default: options.skipType ? '' : options.defaultType,
    },
    {
      type: 'input',
      name: 'jira',
      message: `Enter JIRA issue (${getFromOptionsOrDefaults(options, 'jiraPrefix')}-12345)${options.jiraOptional ? ' (optional)' : ''}:`,
      when: options.jiraMode,
      default: jiraIssue || '',
      validate: (jira) =>
        (options.jiraOptional && !jira) ||
        /^(?<!([a-zA-Z0-9]{1,10})-?)[a-zA-Z0-9]+-\d+$/.test(jira),
      filter: (jira) => jira.toUpperCase(),
    },
    {
      type: hasScopes ? 'list' : 'input',
      name: 'scope',
      when: !options.skipScope,
      choices: hasScopes ? scopes : undefined,
      message:
        'What is the scope of this change (e.g. component or file name): ' +
        (hasScopes ? '(select from the list)' : '(press enter to skip)'),
      default: options.defaultScope,
      filter: (value) => value.trim().toLowerCase(),
    },
    {
      type: 'input',
      name: 'customScope',
      when: ({ scope }) => scope === 'custom',
      message: 'Type custom scope (press enter to skip)',
    },
    {
      type: 'limitedInput',
      name: 'subject',
      message: 'Write a short, imperative tense description of the change:',
      default: options.defaultSubject,
      maxLength: maxHeaderWidth - (options.exclamationMark ? 1 : 0),
      leadingLabel: (answers) => {
        let scope = '';
        const providedScope = getProvidedScope(answers);

        if (providedScope && providedScope !== 'none') {
          scope = `(${providedScope})`;
        }

        const jiraWithDecorators = decorateJiraIssue(answers.jira, options);

        return getJiraIssueLocation(
          options.jiraLocation,
          answers.type ?? '',
          scope,
          jiraWithDecorators,
          '',
        ).trim();
      },
      validate: (input) =>
        input.length >= minHeaderWidth ||
        `The subject must have at least ${minHeaderWidth} characters`,
      filter: (subject) => filterSubject(subject),
    },
    {
      type: 'input',
      name: 'body',
      when: !options.skipDescription,
      message:
        'Provide a longer description of the change: (press enter to skip)\n',
      default: options.defaultBody,
    },
    {
      type: 'confirm',
      name: 'isBreaking',
      when: !options.skipBreaking,
      message: 'Are there any breaking changes?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'isBreaking',
      message:
        'You do know that this will bump the major version, are you sure?',
      default: false,
      when: (answers) => answers.isBreaking,
    },
    {
      type: 'input',
      name: 'breaking',
      message: 'Describe the breaking changes:\n',
      when: (answers) => answers.isBreaking,
    },
    {
      type: 'confirm',
      name: 'isIssueAffected',
      message: 'Does this change affect any open issues?',
      default: options.defaultIssues ? true : false,
      when: !options.jiraMode,
    },
    {
      type: 'input',
      name: 'issuesBody',
      default: '-',
      message:
        'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself:\n',
      when: (answers) =>
        Boolean(
          answers.isIssueAffected && !answers.body && !answers.breakingBody,
        ),
    },
    {
      type: 'input',
      name: 'issues',
      message: 'Add issue references (e.g. "fix #123", "re #123".):\n',
      when: (answers) => answers.isIssueAffected,
      default: options.defaultIssues || undefined,
    },
  ];
}

export function buildCommitMessage(
  answers: PromptAnswers,
  options: AdapterOptions,
): string {
  const wrapOptions = {
    trim: true,
    cut: false,
    newline: '\n',
    indent: '',
    width: options.maxLineWidth,
  };

  const providedScope = getProvidedScope(answers);
  let scope = providedScope ? `(${providedScope})` : '';
  const addExclamationMark = Boolean(
    options.exclamationMark && answers.breaking,
  );

  if (addExclamationMark) {
    scope += '!';
  }

  const jiraWithDecorators = decorateJiraIssue(answers.jira, options);
  const head = getJiraIssueLocation(
    options.jiraLocation,
    answers.type ?? '',
    scope,
    jiraWithDecorators,
    answers.subject,
  );

  let body = answers.body ? wrap(answers.body, wrapOptions) : false;

  if (options.jiraMode && options.jiraLocation === 'post-body') {
    body = body === false ? '' : `${body}\n\n`;
    body += jiraWithDecorators.trim();
  }

  const trimmedBreaking = answers.breaking ? answers.breaking.trim() : '';
  const breaking = trimmedBreaking
    ? wrap(
        `BREAKING CHANGE: ${trimmedBreaking.replace(/^BREAKING CHANGE: /, '')}`,
        wrapOptions,
      )
    : false;

  const issues = answers.issues ? wrap(answers.issues, wrapOptions) : false;

  return filter([head, body, breaking, issues]).join('\n\n');
}

export default function engine(options: AdapterOptions): CommitizenAdapter {
  return {
    prompter(cz, commit, testMode) {
      cz.registerPrompt('limitedInput', LimitedInputPrompt);

      void cz
        .prompt<PromptAnswers>(createQuestions(options))
        .then(async (answers) => {
          const fullCommit = buildCommitMessage(answers, options);

          if (testMode) {
            commit(fullCommit);
            return;
          }

          console.log();
          console.log(styleText('underline', 'Commit preview:'));
          console.log(
            boxen(styleText('green', fullCommit), {
              padding: 1,
              margin: 1,
            }),
          );

          const { doCommit } = await cz.prompt<{ doCommit: boolean }>([
            {
              type: 'confirm',
              name: 'doCommit',
              message: 'Are you sure that you want to commit?',
            },
          ]);

          if (doCommit) {
            commit(fullCommit);
          }
        });
    },
  };
}
