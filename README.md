# @rtvision/cz-conventional-changelog-for-jira

Part of the [commitizen/cz-cli](https://github.com/commitizen/cz-cli) family. Prompts for the [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) format and also prompts for a mandatory JIRA issue.

This package is based on `digitalroute/cz-conventional-changelog-for-jira`. Original authorship and upstream credit belong to DigitalRoute.

## Features

- Works with semantic-release
- Works with Jira smart commits
- Detects the Jira issue from the current branch name
- Ships as pure ESM with TypeScript declarations

## Quickstart

### Installation

```bash
pnpm add -D commitizen @rtvision/cz-conventional-changelog-for-jira
```

Then add the adapter to `package.json`:

```json
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "@rtvision/cz-conventional-changelog-for-jira"
    }
  }
}
```

### Usage

![Gif of terminal when using cz-conventional-changelog-for-jira](https://raw.githubusercontent.com/digitalroute/cz-conventional-changelog-for-jira/master/images/demo.gif)

## Development

This repo uses pnpm, tsdown, oxlint, oxfmt, TypeScript, tsgo, and Vitest.

```bash
pnpm install
pnpm run build
pnpm run check
pnpm test
```

## Configuration

Like commitizen, you can specify configuration for this adapter through `config.commitizen` in `package.json` or via environment variables.

| Environment variable  | package.json      | Default             | Description                                                                                            |
| --------------------- | ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `CZ_JIRA_MODE`        | `jiraMode`        | `true`              | Ask for a Jira issue in the header. If `false`, ask for issue references later for GitHub-style flows. |
| `CZ_MAX_HEADER_WIDTH` | `maxHeaderWidth`  | `72`                | Maximum commit header length.                                                                          |
| `CZ_MIN_HEADER_WIDTH` | `minHeaderWidth`  | `2`                 | Minimum commit subject length.                                                                         |
| `CZ_MAX_LINE_WIDTH`   | `maxLineWidth`    | `100`               | Maximum wrapped body line width.                                                                       |
| `CZ_SKIP_SCOPE`       | `skipScope`       | `true`              | Skip scope input.                                                                                      |
| `CZ_SKIP_TYPE`        | `skipType`        | `false`             | Skip type input.                                                                                       |
| `CZ_SKIP_DESCRIPTION` | `skipDescription` | `false`             | Skip body input.                                                                                       |
| `CZ_SKIP_BREAKING`    | `skipBreaking`    | `false`             | Skip breaking-change questions.                                                                        |
|                       | `scopes`          | `undefined`         | List of predefined scopes. When present, scope becomes a selectable list.                              |
| `CZ_TYPE`             | `defaultType`     | `undefined`         | Default type.                                                                                          |
| `CZ_SCOPE`            | `defaultScope`    | `undefined`         | Default scope.                                                                                         |
| `CZ_CUSTOM_SCOPE`     | `customScope`     | `false`             | Allow custom scope in addition to predefined scopes.                                                   |
| `CZ_SUBJECT`          | `defaultSubject`  | `undefined`         | Default subject.                                                                                       |
| `CZ_BODY`             | `defaultBody`     | `undefined`         | Default body.                                                                                          |
| `CZ_ISSUES`           | `defaultIssues`   | `undefined`         | Default issue references.                                                                              |
| `CZ_JIRA_OPTIONAL`    | `jiraOptional`    | `false`             | Allow the Jira field to be blank.                                                                      |
| `CZ_JIRA_PREFIX`      | `jiraPrefix`      | `"DAZ"`             | Default Jira ticket prefix shown in the prompt.                                                        |
| `CZ_JIRA_LOCATION`    | `jiraLocation`    | `"pre-description"` | Jira ID position. Options: `pre-type`, `pre-description`, `post-description`, `post-body`.             |
| `CZ_JIRA_PREPEND`     | `jiraPrepend`     | `""`                | Prefix decorator for the Jira ID, for example `[`                                                      |
| `CZ_JIRA_APPEND`      | `jiraAppend`      | `""`                | Suffix decorator for the Jira ID, for example `]`                                                      |
| `CZ_EXCLAMATION_MARK` | `exclamationMark` | `false`             | Add `!` after the scope for breaking changes, for example `type(scope)!:`                              |

### Jira Location Options

`pre-type`

```text
JIRA-1234 type(scope): commit subject
```

`pre-description`

```text
type(scope): JIRA-1234 commit subject
```

`post-description`

```text
type(scope): commit subject JIRA-1234
```

`post-body`

```text
type(scope): commit subject

JIRA-1234
```

```text
type(scope): commit subject

this is a commit body

JIRA-1234
```

## Dynamic Configuration

If you want your own profile, use the configurable entrypoint.

`commitizen.config.mjs`

```js
import configurable from '@rtvision/cz-conventional-changelog-for-jira/configurable';
import defaultTypes from '@rtvision/cz-conventional-changelog-for-jira/types';

export default configurable({
  types: {
    ...defaultTypes,
    perf: {
      description: 'Improvements that will make your code perform better',
      title: 'Performance',
    },
  },
  skipScope: false,
  scopes: ['myScope1', 'myScope2'],
  customScope: true,
});
```

`package.json`

```json
{
  "config": {
    "commitizen": {
      "path": "./commitizen.config.mjs"
    }
  }
}
```

This example:

- adds a `perf` commit type
- enables scopes
- limits predefined scopes to `myScope1` and `myScope2`
- allows entering a custom scope

Supported configurable options:

| Key               | Default             | Description                                       |
| ----------------- | ------------------- | ------------------------------------------------- |
| `jiraMode`        | `true`              | Ask for a Jira issue in the header.               |
| `maxHeaderWidth`  | `72`                | Maximum commit header length.                     |
| `minHeaderWidth`  | `2`                 | Minimum subject length.                           |
| `maxLineWidth`    | `100`               | Maximum wrapped line width.                       |
| `skipScope`       | `true`              | Skip scope input.                                 |
| `skipType`        | `false`             | Skip type input.                                  |
| `skipDescription` | `false`             | Skip body input.                                  |
| `skipBreaking`    | `false`             | Skip breaking-change questions.                   |
| `defaultType`     | `undefined`         | Default type.                                     |
| `defaultScope`    | `undefined`         | Default scope.                                    |
| `defaultSubject`  | `undefined`         | Default subject.                                  |
| `defaultBody`     | `undefined`         | Default body.                                     |
| `defaultIssues`   | `undefined`         | Default issue references.                         |
| `jiraPrefix`      | `'DAZ'`             | Default Jira prefix shown in the prompt.          |
| `types`           | `./types.js`        | Supported commit types.                           |
| `scopes`          | `undefined`         | List of predefined scopes.                        |
| `customScope`     | `false`             | Allow a custom scope alongside predefined scopes. |
| `jiraOptional`    | `false`             | Allow an empty Jira field.                        |
| `jiraLocation`    | `'pre-description'` | Jira ID position.                                 |
| `jiraPrepend`     | `''`                | Prefix decorator for the Jira ID.                 |
| `jiraAppend`      | `''`                | Suffix decorator for the Jira ID.                 |
| `exclamationMark` | `false`             | Add `!` after scope for breaking changes.         |

### Commitlint

If you use the [commitlint](https://github.com/conventional-changelog/commitlint) JS library, `maxHeaderWidth` defaults to the `header-max-length` rule unless you override it through `package.json` or `CZ_MAX_HEADER_WIDTH`.
