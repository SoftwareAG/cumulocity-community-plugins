const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// TODO: instead of dictionary of tags and versions, return a list of last 3 versions. possibly semver package needed to find out the last 3 versions.
async function getDistTags(packageName) {
  try {
    const { stdout } = await execPromise(
      `npm view ${packageName} dist-tags --json`
    );
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Error fetching dist-tags:', error);
    return {};
  }
}

async function isDeprecated(packageName, version) {
  try {
    const deprecatedInfo = (
      await execPromise(`npm view ${packageName}@${version} deprecated --json`)
    )?.stdout;
    return !!deprecatedInfo;
  } catch (error) {
    console.error(
      `Error checking if ${packageName}@${version} is deprecated:`,
      error
    );
    return false;
  }
}

async function getNonDeprecatedVersions(packageName) {
  const distTags = await getDistTags(packageName);
  const nonDeprecatedVersions = {};

  for (const [tag, version] of Object.entries(distTags)) {
    const deprecated = await isDeprecated(packageName, version);
    if (!deprecated) {
      nonDeprecatedVersions[tag] = version;
    }
  }

  return nonDeprecatedVersions;
}

(async () => {
  const packageName = '@c8y/ngx-components';
  const nonDeprecatedVersions = await getNonDeprecatedVersions(packageName);
  process.stdout.write(
    `::set-output name=non_deprecated_shell_versions::${JSON.stringify(
      nonDeprecatedVersions
    )}`
  );
})();