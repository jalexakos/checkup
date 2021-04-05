import * as chalk from 'chalk';

import BaseGenerator, { Works } from './base-generator';
import { writeConfig, CheckupError, ErrorKind } from '@checkup/core';

export default class ConfigGenerator extends BaseGenerator {
  works: Works = Works.OutsideProject;

  async initializing() {
    if (!this.canRunGenerator) {
      throw new CheckupError(ErrorKind.ConfigFileExists, {
        configDestination: this.destinationRoot(),
      });
    }
  }

  async prompting() {
    this.headline('checkup config');
  }

  async writing() {
    writeConfig(this.destinationRoot());

    this.log(`   ${chalk.green('create')} ${this.destinationPath('.checkuprc')}`);
  }
}
