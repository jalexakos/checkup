/* eslint-disable jest/expect-expect */

import * as helpers from 'yeoman-test';

import { createTmpDir, testRoot } from '@checkup/test-helpers';

import PluginGenerator from '../../src/generators/plugin';
import TaskGenerator from '../../src/generators/task';
import { join } from 'path';

function assertTaskFiles(name: string, dir: string, extension: string = 'ts') {
  let root = testRoot(dir);

  expect(root.file(`src/tasks/${name}-task.${extension}`).contents).toMatchSnapshot();
  expect(root.file(`src/results/${name}-task-result.${extension}`).contents).toMatchSnapshot();
  expect(root.file(`__tests__/${name}-task-test.${extension}`).contents).toMatchSnapshot();
}

function assertPluginFiles(dir: string, extension: string = 'ts') {
  let root = testRoot(dir);

  expect(root.file(`src/hooks/register-tasks.${extension}`).contents).toMatchSnapshot();
}

async function generatePlugin(
  options: object = {
    name: 'my-plugin',
    defaults: true,
  },
  prompts: object = {
    typescript: true,
  }
) {
  let tmp = createTmpDir();
  let dir = await helpers
    .run(PluginGenerator, { namespace: 'checkup:plugin' })
    .cd(tmp)
    .withOptions(options)
    .withPrompts(prompts);

  return join(dir, 'checkup-plugin-my-plugin');
}

describe('task generator', () => {
  it('generates correct files with TypeScript for defaults', async () => {
    let baseDir = await generatePlugin();
    let dir = await helpers
      .run(TaskGenerator, { namespace: 'checkup:task' })
      .cd(baseDir)
      .withOptions({
        name: 'my-foo',
        defaults: true,
      });

    assertTaskFiles('my-foo', dir);
    assertPluginFiles(dir);
  });

  it('generates multiple correct files with TypeScript for defaults', async () => {
    let baseDir = await generatePlugin();
    let dir = await helpers
      .run(TaskGenerator, { namespace: 'checkup:task' })
      .cd(baseDir)
      .withOptions({
        name: 'my-foo',
        defaults: true,
      });

    dir = await helpers.run(TaskGenerator, { namespace: 'checkup:task' }).cd(baseDir).withOptions({
      name: 'my-bar',
      defaults: true,
    });

    assertTaskFiles('my-foo', dir);
    assertTaskFiles('my-bar', dir);
    assertPluginFiles(dir);
  });

  it('generates correct files with JavaScript', async () => {
    let baseDir = await generatePlugin({ name: 'my-plugin' }, { typescript: false });
    let dir = await helpers
      .run(TaskGenerator, { namespace: 'checkup:task' })
      .cd(baseDir)
      .withOptions({
        name: 'my-foo',
      })
      .withPrompts({
        typescript: false,
      });

    assertTaskFiles('my-foo', dir, 'js');
    assertPluginFiles(dir, 'js');
  });

  it('generates correct files with category', async () => {
    let baseDir = await generatePlugin();
    let dir = await helpers
      .run(TaskGenerator, { namespace: 'checkup:task' })
      .cd(baseDir)
      .withOptions({
        name: 'my-foo',
      })
      .withPrompts({
        category: 'Insights',
      });

    assertTaskFiles('my-foo', dir);
    assertPluginFiles(dir);
  });

  it('generates correct files with priority', async () => {
    let baseDir = await generatePlugin();
    let dir = await helpers
      .run(TaskGenerator, { namespace: 'checkup:task' })
      .cd(baseDir)
      .withOptions({
        name: 'my-foo',
      })
      .withPrompts({
        priority: 'High',
      });

    assertTaskFiles('my-foo', dir);
    assertPluginFiles(dir);
  });
});
