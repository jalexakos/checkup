import * as Wrap from 'wrap-ansi';
import * as ci from 'ci-info';
import { join } from 'path';
import { red } from 'chalk';
import { ErrorDetails, ErrorDetailOptions, ErrorKind, ERROR_BY_KIND } from './error-kind';
import { todayFormat } from '../today-format';
import { ensureDirSync, writeFileSync, readJsonSync } from 'fs-extra';

const stripAnsi = require('strip-ansi');
const clean = require('clean-stack');

export default class CheckupError extends Error {
  private details: ErrorDetails;
  private options: ErrorDetailOptions;

  constructor(kind: ErrorKind, options: ErrorDetailOptions = {}) {
    let details = ERROR_BY_KIND[kind];

    super(details.message(options));

    this.name = 'CheckupError';
    this.details = details;
    this.options = options;

    // prevent this class from appearing in the stack
    Error.captureStackTrace(this, CheckupError);
  }

  render(): string {
    const wrap: typeof Wrap = require('wrap-ansi');

    process.exitCode = this.details.errorCode;

    let details: string[] = [];

    details.push(`${red('Checkup Error')}: ${this.message}`);
    details.push(`${this.details.callToAction(this.options)}`);

    if (ci.isCI) {
      return details.join('\n');
    } else {
      let logFilePath = this.writeErrorLog(details);

      details.push(`Error details written to ${logFilePath}`);
      return wrap(details.join('\n'), 80, { trim: false, hard: true });
    }
  }

  writeErrorLog(details: string[]) {
    let logFileName = `checkup-error-${todayFormat()}.log`;
    let logPath = join(process.cwd(), '.checkup');
    let logFilePath = join(logPath, logFileName);
    let logOutput: string[] = [];
    let version = readJsonSync(join(__dirname, '../../package.json')).version;

    logOutput.push(`Checkup v${version}`);
    logOutput.push('');
    logOutput.push(stripAnsi(details.join('\n')));
    logOutput.push('');
    logOutput.push(clean(this.stack || 'No stack available'));

    ensureDirSync(logPath);

    writeFileSync(logFilePath, logOutput.join('\n'), { encoding: 'utf-8' });

    return logFilePath;
  }
}
