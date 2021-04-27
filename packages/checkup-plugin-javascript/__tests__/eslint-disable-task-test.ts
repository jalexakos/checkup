import { getPluginName } from '@checkup/core';
import { CheckupProject, getTaskContext } from '@checkup/test-helpers';

import EslintDisableTask from '../src/tasks/eslint-disable-task';
import { evaluateActions } from '../src/actions/eslint-disable-actions';

describe('eslint-disable-task', () => {
  let project: CheckupProject;
  let pluginName = getPluginName(__dirname);

  beforeEach(function () {
    project = new CheckupProject('foo', '0.0.0');
    project.files['index.js'] = `
    // eslint-disable-line no-eval
    /* eslint-disable */

    function foo(obj) { // adding this here because without babel parser, recast fails on this
      return {     // eslint-disable-line
        ...obj
      }
    }
    `;

    project.files['decorator.js'] = `
      /* eslint-disable */

      @decorated
      export default class Bar {
        barBaz() {
          return baz.toLowerCase();
        }
      }
    `;

    project.writeSync();
  });

  afterEach(function () {
    project.dispose();
  });

  it('returns all the types found in the app and outputs to json', async () => {
    const result = await new EslintDisableTask(
      pluginName,
      getTaskContext({
        paths: project.filePaths,
        options: { cwd: project.baseDir },
      })
    ).run();

    for (let r of result) {
      expect(r).toBeValidSarifFor('result');
    }
  });

  it('returns actions if there are more than 2 instances of eslint-disable', async () => {
    const task = new EslintDisableTask(
      pluginName,
      getTaskContext({
        paths: project.filePaths,
        options: { cwd: project.baseDir },
      })
    );
    const result = await task.run();

    let actions = evaluateActions(result, task.config);

    expect(actions).toHaveLength(1);
    expect(actions![0]).toMatchInlineSnapshot(`
      Object {
        "defaultThreshold": 2,
        "details": "4 usages of eslint-disable",
        "input": 4,
        "items": Array [
          "Total eslint-disable usages: 4",
        ],
        "name": "reduce-eslint-disable-usages",
        "summary": "Reduce number of eslint-disable usages",
      }
    `);
  });
});
