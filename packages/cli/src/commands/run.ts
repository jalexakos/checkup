import {
  CheckupConfig,
  CheckupError,
  OutputFormat,
  RunFlags,
  Task,
  TaskResult,
  TaskContext,
  TaskError,
  Action,
  loadPlugins,
  registerParser,
  registerActions,
  registerTaskReporter,
  getFilePaths,
  getConfigPath,
  readConfig,
  getRegisteredParsers,
  getRegisteredActions,
  ui,
} from '@checkup/core';

import { BaseCommand } from '../base-command';
import MetaTaskList from '../meta-task-list';
import { MetaTaskResult } from '../types';
import TaskList from '../task-list';
import { flags } from '@oclif/command';
import { getPackageJson } from '../utils/get-package-json';
import { getReporter } from '../reporters/get-reporter';
import LinesOfCodeTask from '../tasks/lines-of-code-task';
import ProjectMetaTask from '../tasks/project-meta-task';
import * as chalk from 'chalk';

let __tasksForTesting: Set<Task> = new Set<Task>();

export function _registerTaskForTesting(task: Task) {
  __tasksForTesting.add(task);
}
export function _resetTasksForTesting() {
  __tasksForTesting = new Set<Task>();
}

export default class RunCommand extends BaseCommand {
  static description = 'A health checkup for your project';

  // required for variable length command line arguments
  static strict = false;

  static usage = '[run] PATHS';

  static args = [
    {
      name: 'paths',
      description:
        'The paths that checkup will operate on. If no paths are provided, checkup will run on the entire directory beginning at --cwd.',
    },
  ];

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    excludePaths: flags.string({
      description:
        'Paths to exclude from checkup. If paths are provided via command line and via checkup config, command line paths will be used.',
      char: 'e',
      multiple: true,
    }),
    config: flags.string({
      char: 'c',
      description: 'Use this configuration, overriding .checkuprc.* if present.',
    }),
    cwd: flags.string({
      default: () => process.cwd(),
      char: 'd',
      description: 'The path referring to the root directory that Checkup will run in',
    }),
    task: flags.string({
      char: 't',
      description:
        'Runs specific task specified by the fully qualified task name in the format pluginName/taskName. Can be used multiple times.',
      multiple: true,
    }),
    format: flags.string({
      char: 'f',
      options: [...Object.values(OutputFormat)],
      default: 'stdout',
      description: `The output format, one of ${[...Object.values(OutputFormat)].join(', ')}`,
    }),
    outputFile: flags.string({
      char: 'o',
      default: '',
      description:
        'Specify file to write JSON output to. Requires the `--format` flag to be set to `json`',
    }),
    listTasks: flags.boolean({
      char: 'l',
      description: 'List all available tasks to run.',
    }),
  };

  runArgs!: string[];
  runFlags!: RunFlags;
  defaultTasks: MetaTaskList = new MetaTaskList();
  metaTaskResults: MetaTaskResult[] = [];
  metaTaskErrors: TaskError[] = [];
  pluginTasks: TaskList = new TaskList();
  pluginTaskResults: TaskResult[] = [];
  pluginTaskErrors: TaskError[] = [];
  actions: Action[] = [];
  checkupConfig!: CheckupConfig;

  public async init() {
    let { argv, flags } = this.parse(RunCommand);

    if (flags.outputFile && flags.format !== OutputFormat.json) {
      this.error(
        new Error(
          'Missing --format flag. --format=json must also be provided when using --outputFile'
        )
      );
    }

    this.runArgs = argv;
    this.runFlags = flags;
  }

  public async run() {
    await this.loadConfig();

    await this.register();

    if (this.runFlags.listTasks) {
      this.printAvailableTasks();
    } else {
      ui.action.start('Checking up on your project');
      await this.runTasks();
      await this.runActions();
      this.report();
      ui.action.stop();
    }
  }

  private async registerDefaultTasks(context: TaskContext) {
    let pluginName = 'meta';

    this.defaultTasks.registerTask(new ProjectMetaTask(pluginName, context));

    // TODO: figure out where to put this. Internal? External?
    this.pluginTasks.registerTask(new LinesOfCodeTask(pluginName, context));
  }

  private async runTasks() {
    [this.metaTaskResults, this.metaTaskErrors] = await this.defaultTasks.runTasks();

    if (this.runFlags.task !== undefined) {
      let { tasksFound, tasksNotFound } = this.pluginTasks.findTasks(...this.runFlags.task);

      if (tasksFound.length > 0) {
        [this.pluginTaskResults, this.pluginTaskErrors] = await this.pluginTasks.runTasks(
          tasksFound
        );
      }

      if (tasksNotFound.length > 0) {
        this.extendedError(
          new CheckupError(
            `Cannot find the ${tasksNotFound.join(',')} task${
              tasksNotFound.length > 1 ? 's' : '' // pluralize task if more than one task is not found
            }.`,
            'Run `checkup --listTasks` to see available tasks'
          )
        );
        ui.action.stop();
      }
    } else {
      [this.pluginTaskResults, this.pluginTaskErrors] = await this.pluginTasks.runTasks();
    }
  }

  private runActions() {
    let evaluators = getRegisteredActions();

    for (let [taskName, evaluator] of evaluators) {
      let task = this.pluginTasks.findTask(taskName);
      let taskResult = this.pluginTaskResults.find((result) => taskName === result.info.taskName);

      if (task && taskResult) {
        this.actions.push(...evaluator(taskResult, task.config));
      }
    }
  }

  private async loadConfig() {
    let configPath;

    try {
      configPath = this.runFlags.config || getConfigPath(this.runFlags.cwd);
      this.checkupConfig = readConfig(configPath);

      let plugins = await loadPlugins(this.checkupConfig.plugins, this.runFlags.cwd);

      this.config.plugins.push(...plugins);
    } catch (error) {
      this.extendedError(error);
    }
  }

  private async register() {
    let taskContext: TaskContext;

    await this.config.runHook('register-parsers', {
      registerParser,
    });

    await this.config.runHook('register-actions', {
      registerActions,
    });

    await this.config.runHook('register-task-reporter', {
      registerTaskReporter,
    });

    // if excludePaths are provided both via the command line and config, the command line is prioritized
    let excludePaths = this.runFlags.excludePaths || this.checkupConfig.excludePaths;

    taskContext = Object.freeze({
      cliArguments: this.runArgs,
      cliFlags: this.runFlags,
      parsers: getRegisteredParsers(),
      config: this.checkupConfig,
      pkg: getPackageJson(this.runFlags.cwd),
      paths: getFilePaths(this.runFlags.cwd, this.runArgs, excludePaths),
    });

    await this.registerDefaultTasks(taskContext);

    await this.config.runHook('register-tasks', {
      context: taskContext,
      tasks: this.pluginTasks,
    });

    __tasksForTesting.forEach((task: Task) => {
      this.pluginTasks.registerTask(task);
    });
  }

  private report() {
    let errors = [...this.metaTaskErrors, ...this.pluginTaskErrors];
    let generateReport = getReporter(this.runFlags.format as OutputFormat);
    generateReport({
      flags: this.runFlags,
      info: this.metaTaskResults,
      results: this.pluginTaskResults,
      errors,
      actions: this.actions,
    });
  }

  private printAvailableTasks() {
    ui.blankLine();
    ui.log(chalk.bold.white('AVAILABLE TASKS'));
    ui.blankLine();
    this.pluginTasks.fullyQualifiedTaskNames.forEach((taskName) => {
      ui.log(`  ${taskName}`);
    });
    ui.blankLine();
  }
}
