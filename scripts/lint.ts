import * as _ from 'underscore';
import minimist from 'minimist';
import { spawnSync } from 'child_process';

const argv = minimist(process.argv.slice(2));
const commit = argv.commit !== undefined && argv.commit.toString() === 'true';
const branch = argv['commit-branch'];

function runCommand(command: string): string[] {
  if (command.indexOf('yarn dlx') >= 0) {
    console.error(
      'Yarn commands are not supported! Yarn prints extra lines that break processing command output.'
    );
    process.exit(1);
  }

  const child = spawnSync(command, undefined, {
    shell: true,
    // stdio: 'inherit'
  });

  if (child.status > 0) {
    console.error(child.output.join('\n'));
    process.exit(child.status);
  }

  const lines = child.output.join('\n').split('\n');

  return _.without(lines, '');
}

function format(): boolean {
  console.log('\n🧼️ Formatting files...');

  const lines = runCommand('npx prettier --write --list-different .');

  _.each(lines, (line, i) => {
    const ascii = i + 1 < lines.length ? '├' : '└';
    console.log(`   ${ascii} ${line}`);
  });

  return lines.length > 0;
}

function lint(): boolean {
  console.log('\n🧼️ Linting files...');

  const lines = runCommand('npx eslint --fix --quiet -f compact .');

  if (lines.length > 1) {
    lines.pop();
  }

  _.each(lines, (line, i) => {
    const ascii = i + 1 < lines.length ? '├' : '└';
    console.log(`   ${ascii} ${line}`);
  });

  return lines.length > 0;
}

const hasFormatChanges = format();
const hasLintChanges = lint();

if ((hasFormatChanges || hasLintChanges) && commit) {
  console.log('\n📤 Committing changes...');

  const push = branch !== undefined ? ` && git push -u origin ${branch}` : '';

  const child = spawnSync(
    `git add . && git commit -m 'cleanup(misc): formatting and lint changes'${push}`,
    undefined,
    {
      shell: true,
      // stdio: 'inherit'
    }
  );

  console.log(child.output.join('\n'));
  process.exit(child.status);
}
