import commitizenModule from 'commitizen';

import type {
  AdapterOptions,
  CommitizenConfig,
  JiraLocation,
} from '#src/contracts.js';
import defaults from '#src/defaults.js';
import engine from '#src/engine.js';
import conventionalCommitTypes from '#src/types.js';

function getEnvOrConfig(
  env: string | undefined,
  configVar: boolean | undefined,
  defaultValue: boolean,
): boolean {
  const isEnvSet = Boolean(env);
  const isConfigSet = typeof configVar === 'boolean';

  if (isEnvSet) {
    return env === 'true';
  }

  if (isConfigSet) {
    return configVar;
  }

  return defaultValue;
}

function getNumericEnvOrConfig(
  env: string | undefined,
  configVar: number | undefined,
  defaultValue: number,
): number {
  if (env) {
    return Number.parseInt(env, 10);
  }

  return configVar ?? defaultValue;
}

function getJiraLocation(
  env: string | undefined,
  configVar: JiraLocation | undefined,
  defaultValue: JiraLocation,
): JiraLocation {
  const value = env || configVar || defaultValue;

  if (
    value === 'pre-type' ||
    value === 'pre-description' ||
    value === 'post-description' ||
    value === 'post-body'
  ) {
    return value;
  }

  return defaultValue;
}

function loadConfig(): CommitizenConfig {
  const commitizen = commitizenModule as unknown as {
    configLoader?: { load(): CommitizenConfig };
    default?: {
      configLoader?: { load(): CommitizenConfig };
    };
  };
  const loaded =
    commitizen.configLoader?.load() ?? commitizen.default?.configLoader?.load();

  return loaded ?? {};
}

async function loadCommitlintHeaderWidth(
  options: AdapterOptions,
  config: CommitizenConfig,
): Promise<void> {
  try {
    const commitlintModule = (await import('@commitlint/load')) as {
      default?: () => Promise<{ rules?: Record<string, unknown> }>;
    };
    const commitlintLoad = commitlintModule.default;

    if (!commitlintLoad) {
      return;
    }

    const commitlintConfig = await commitlintLoad();
    const maxHeaderLengthRule = commitlintConfig.rules?.['header-max-length'];

    if (
      Array.isArray(maxHeaderLengthRule) &&
      maxHeaderLengthRule.length >= 3 &&
      !process.env.CZ_MAX_HEADER_WIDTH &&
      !config.maxHeaderWidth
    ) {
      options.maxHeaderWidth = Number(maxHeaderLengthRule[2]);
    }
  } catch {
    // Optional dependency.
  }
}

const config = loadConfig();

const options: AdapterOptions = {
  types: conventionalCommitTypes,
  scopes: config.scopes,
  jiraMode: getEnvOrConfig(
    process.env.CZ_JIRA_MODE,
    config.jiraMode,
    defaults.jiraMode,
  ),
  skipScope: getEnvOrConfig(
    process.env.CZ_SKIP_SCOPE,
    config.skipScope,
    defaults.skipScope,
  ),
  skipType: getEnvOrConfig(
    process.env.CZ_SKIP_TYPE,
    config.skipType,
    defaults.skipType,
  ),
  skipDescription: getEnvOrConfig(
    process.env.CZ_SKIP_DESCRIPTION,
    config.skipDescription,
    defaults.skipDescription,
  ),
  skipBreaking: getEnvOrConfig(
    process.env.CZ_SKIP_BREAKING,
    config.skipBreaking,
    defaults.skipBreaking,
  ),
  customScope: getEnvOrConfig(
    process.env.CZ_CUSTOM_SCOPE,
    config.customScope,
    defaults.customScope,
  ),
  defaultType: process.env.CZ_TYPE || config.defaultType,
  defaultScope: process.env.CZ_SCOPE || config.defaultScope,
  defaultSubject: process.env.CZ_SUBJECT || config.defaultSubject,
  defaultBody: process.env.CZ_BODY || config.defaultBody,
  defaultIssues: process.env.CZ_ISSUES || config.defaultIssues,
  maxHeaderWidth: getNumericEnvOrConfig(
    process.env.CZ_MAX_HEADER_WIDTH,
    config.maxHeaderWidth,
    defaults.maxHeaderWidth,
  ),
  minHeaderWidth: getNumericEnvOrConfig(
    process.env.CZ_MIN_HEADER_WIDTH,
    config.minHeaderWidth,
    defaults.minHeaderWidth,
  ),
  maxLineWidth: getNumericEnvOrConfig(
    process.env.CZ_MAX_LINE_WIDTH,
    config.maxLineWidth,
    defaults.maxLineWidth,
  ),
  jiraOptional: getEnvOrConfig(
    process.env.CZ_JIRA_OPTIONAL,
    config.jiraOptional,
    defaults.jiraOptional,
  ),
  jiraPrefix:
    process.env.CZ_JIRA_PREFIX || config.jiraPrefix || defaults.jiraPrefix,
  jiraLocation: getJiraLocation(
    process.env.CZ_JIRA_LOCATION,
    config.jiraLocation,
    defaults.jiraLocation,
  ),
  jiraPrepend:
    process.env.CZ_JIRA_PREPEND || config.jiraPrepend || defaults.jiraPrepend,
  jiraAppend:
    process.env.CZ_JIRA_APPEND || config.jiraAppend || defaults.jiraAppend,
  exclamationMark: getEnvOrConfig(
    process.env.CZ_EXCLAMATION_MARK,
    config.exclamationMark,
    defaults.exclamationMark,
  ),
};

void loadCommitlintHeaderWidth(options, config);

const adapter = engine(options);

export default adapter;
