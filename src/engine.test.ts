import { beforeEach, describe, expect, it, vi } from 'vitest';

import defaults from '#src/defaults.js';
import {
  buildCommitMessage,
  createQuestions,
  filterSubject,
  getJiraIssueLocation,
} from '#src/engine.js';

const defaultOptions = defaults;
const skipTypeOptions = {
  ...defaultOptions,
  skipType: true,
};

const type = 'func';
const scope = 'everything';
const customScope = 'custom scope';
const jiraUpperCase = 'DAZ-123';
const subject = 'testing123';
const shortBody = 'a';
const longBody =
  'a a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a' +
  'a a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a' +
  'a a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a aa a';
const longBodySplit =
  longBody.slice(0, defaultOptions.maxLineWidth).trim() +
  '\n' +
  longBody
    .slice(defaultOptions.maxLineWidth, 2 * defaultOptions.maxLineWidth)
    .trim() +
  '\n' +
  longBody.slice(defaultOptions.maxLineWidth * 2).trim();
const body = 'A quick brown fox jumps over the dog';
const issues = 'a issues is not a person that kicks things';
const longIssues =
  'b b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b' +
  'b b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b' +
  'b b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b bb b';
const longIssuesSplit =
  longIssues.slice(0, defaultOptions.maxLineWidth).trim() +
  '\n' +
  longIssues
    .slice(defaultOptions.maxLineWidth, defaultOptions.maxLineWidth * 2)
    .trim() +
  '\n' +
  longIssues.slice(defaultOptions.maxLineWidth * 2).trim();
const breakingChange = 'BREAKING CHANGE: ';
const breaking = 'asdhdfkjhbakjdhjkashd adhfajkhs asdhkjdsh ahshd';

function toAnswers(
  overrides: Partial<Parameters<typeof buildCommitMessage>[0]>,
) {
  return {
    subject,
    ...overrides,
  };
}

describe('buildCommitMessage', () => {
  it('builds header without scope and without type', () => {
    expect(
      buildCommitMessage(toAnswers({ jira: jiraUpperCase }), skipTypeOptions),
    ).toBe(`${jiraUpperCase} ${subject}`);
  });

  it('builds header with scope and type', () => {
    expect(
      buildCommitMessage(
        toAnswers({ type, scope, jira: jiraUpperCase }),
        defaultOptions,
      ),
    ).toBe(`${type}(${scope}): ${jiraUpperCase} ${subject}`);
  });

  it('supports custom scopes', () => {
    expect(
      buildCommitMessage(
        toAnswers({
          type,
          scope: 'custom',
          customScope,
          jira: jiraUpperCase,
          body,
        }),
        defaultOptions,
      ),
    ).toBe(`${type}(${customScope}): ${jiraUpperCase} ${subject}\n\n${body}`);
  });

  it('wraps long body and issues', () => {
    expect(
      buildCommitMessage(
        toAnswers({
          type,
          scope,
          jira: jiraUpperCase,
          body: longBody,
          issues: longIssues,
        }),
        defaultOptions,
      ),
    ).toBe(
      `${type}(${scope}): ${jiraUpperCase} ${subject}\n\n${longBodySplit}\n\n${longIssuesSplit}`,
    );
  });

  it('adds breaking change footer', () => {
    expect(
      buildCommitMessage(
        toAnswers({
          type,
          scope,
          jira: jiraUpperCase,
          body,
          breaking,
          issues,
        }),
        defaultOptions,
      ),
    ).toBe(
      `${type}(${scope}): ${jiraUpperCase} ${subject}\n\n${body}\n\n${breakingChange}${breaking}\n\n${issues}`,
    );
  });

  it('normalizes breaking change prefix', () => {
    expect(
      buildCommitMessage(
        toAnswers({
          type,
          scope,
          jira: jiraUpperCase,
          body,
          breaking: `${breakingChange}${breaking}`,
          issues,
        }),
        defaultOptions,
      ),
    ).toBe(
      `${type}(${scope}): ${jiraUpperCase} ${subject}\n\n${body}\n\n${breakingChange}${breaking}\n\n${issues}`,
    );
  });

  it('adds exclamation mark when enabled', () => {
    expect(
      buildCommitMessage(
        toAnswers({
          type,
          scope,
          jira: jiraUpperCase,
          body,
          breaking,
          issues,
        }),
        { ...defaultOptions, exclamationMark: true },
      ),
    ).toBe(
      `${type}(${scope})!: ${jiraUpperCase} ${subject}\n\n${body}\n\n${breakingChange}${breaking}\n\n${issues}`,
    );
  });

  it('supports optional jira', () => {
    expect(
      buildCommitMessage(toAnswers({ type, scope, jira: '' }), {
        ...defaultOptions,
        jiraOptional: true,
      }),
    ).toBe(`${type}(${scope}): ${subject}`);
  });

  it('supports post-body jira placement', () => {
    expect(
      buildCommitMessage(
        toAnswers({ type, scope, jira: jiraUpperCase, body }),
        { ...defaultOptions, jiraLocation: 'post-body' },
      ),
    ).toBe(`${type}(${scope}): ${subject}\n\n${body}\n\n${jiraUpperCase}`);
  });

  it('supports jira decorators', () => {
    expect(
      buildCommitMessage(
        toAnswers({ type, scope, jira: jiraUpperCase, body }),
        {
          ...defaultOptions,
          jiraLocation: 'pre-type',
          jiraPrepend: '[',
          jiraAppend: ']',
        },
      ),
    ).toBe(`[${jiraUpperCase}] ${type}(${scope}): ${subject}\n\n${body}`);
  });
});

describe('helpers', () => {
  it('filters subject punctuation', () => {
    expect(filterSubject(' hello... ')).toBe('hello');
  });

  it('uses default jira location fallback', () => {
    expect(
      getJiraIssueLocation(
        'pre-description',
        type,
        `(${scope})`,
        `${jiraUpperCase} `,
        subject,
      ),
    ).toBe(`${type}(${scope}): ${jiraUpperCase} ${subject}`);
  });
});

describe('createQuestions', () => {
  it('uses branch jira as default', () => {
    const jiraQuestion = createQuestions(
      defaultOptions,
      'feature/DAZ-321-test',
    ).find((question) => question.name === 'jira');
    expect(jiraQuestion?.default).toBe('DAZ-321');
  });

  it('supports predefined scopes with custom option', () => {
    const scopeQuestion = createQuestions(
      {
        ...defaultOptions,
        skipScope: false,
        customScope: true,
        scopes: ['one', 'two'],
      },
      '',
    ).find((question) => question.name === 'scope');

    expect(scopeQuestion?.type).toBe('list');
    expect(scopeQuestion?.choices).toEqual(['one', 'two', 'custom']);
  });

  it('validates jira format', () => {
    const jiraQuestion = createQuestions(defaultOptions, '').find(
      (question) => question.name === 'jira',
    );

    expect(jiraQuestion?.validate?.('DAZ-123', toAnswers({}))).toBe(true);
    expect(jiraQuestion?.validate?.('', toAnswers({}))).toBe(false);
  });

  it('validates minimum subject width', () => {
    const subjectQuestion = createQuestions(defaultOptions, '').find(
      (question) => question.name === 'subject',
    );

    expect(subjectQuestion?.validate?.(shortBody, toAnswers({}))).toBe(
      'The subject must have at least 2 characters',
    );
    expect(subjectQuestion?.validate?.(subject, toAnswers({}))).toBe(true);
  });

  it('keeps defaults from options', () => {
    const questions = createQuestions(
      {
        ...defaultOptions,
        defaultType: type,
        defaultScope: scope,
        defaultSubject: subject,
        defaultBody: body,
        defaultIssues: issues,
      },
      '',
    );

    expect(
      questions.find((question) => question.name === 'type')?.default,
    ).toBe(type);
    expect(
      questions.find((question) => question.name === 'scope')?.default,
    ).toBe(scope);
    expect(
      questions.find((question) => question.name === 'subject')?.default,
    ).toBe(subject);
    expect(
      questions.find((question) => question.name === 'body')?.default,
    ).toBe(body);
    expect(
      questions.find((question) => question.name === 'issues')?.default,
    ).toBe(issues);
  });
});

describe('index configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses commitlint header-max-length when no override exists', async () => {
    let capturedOptions: typeof defaults | undefined;

    vi.doMock('#src/engine.js', () => ({
      default: (options: typeof defaults) => {
        capturedOptions = options;
        return { prompter: vi.fn() };
      },
    }));
    vi.doMock('commitizen', () => ({
      default: { configLoader: { load: () => ({}) } },
    }));
    vi.doMock('@commitlint/load', () => ({
      default: vi.fn().mockResolvedValue({
        rules: {
          'header-max-length': [2, 'always', 72],
        },
      }),
    }));

    await import('#src/index.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(capturedOptions?.maxHeaderWidth).toBe(72);
  });

  it('prefers env override over commitlint config', async () => {
    let capturedOptions: typeof defaults | undefined;

    vi.stubEnv('CZ_MAX_HEADER_WIDTH', '105');
    vi.doMock('#src/engine.js', () => ({
      default: (options: typeof defaults) => {
        capturedOptions = options;
        return { prompter: vi.fn() };
      },
    }));
    vi.doMock('commitizen', () => ({
      default: { configLoader: { load: () => ({}) } },
    }));
    vi.doMock('@commitlint/load', () => ({
      default: vi.fn().mockResolvedValue({
        rules: {
          'header-max-length': [2, 'always', 72],
        },
      }),
    }));

    await import('#src/index.js');
    await Promise.resolve();

    expect(capturedOptions?.maxHeaderWidth).toBe(105);
  });

  it('prefers commitizen config override over commitlint config', async () => {
    let capturedOptions: typeof defaults | undefined;

    vi.doMock('#src/engine.js', () => ({
      default: (options: typeof defaults) => {
        capturedOptions = options;
        return { prompter: vi.fn() };
      },
    }));
    vi.doMock('commitizen', () => ({
      default: { configLoader: { load: () => ({ maxHeaderWidth: 103 }) } },
    }));
    vi.doMock('@commitlint/load', () => ({
      default: vi.fn().mockResolvedValue({
        rules: {
          'header-max-length': [2, 'always', 72],
        },
      }),
    }));

    await import('#src/index.js');
    await Promise.resolve();

    expect(capturedOptions?.maxHeaderWidth).toBe(103);
  });
});
