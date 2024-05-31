const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
  console.log(
    'Non-deprecated versions:',
    JSON.stringify(nonDeprecatedVersions, null, 2)
  );
})();
