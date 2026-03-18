import type { AdapterOptions } from '#src/contracts.js';
import conventionalCommitTypes from '#src/types.js';

const defaults: AdapterOptions = {
  types: conventionalCommitTypes,
  jiraMode: true,
  skipScope: true,
  skipType: false,
  skipDescription: false,
  skipBreaking: false,
  customScope: false,
  maxHeaderWidth: 72,
  minHeaderWidth: 2,
  maxLineWidth: 100,
  jiraPrefix: 'DAZ',
  jiraOptional: false,
  jiraLocation: 'pre-description',
  jiraPrepend: '',
  jiraAppend: '',
  exclamationMark: false,
};

export default defaults;
