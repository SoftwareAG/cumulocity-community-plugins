const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Fetches the distribution tags for a given npm package.
 * @param {string} packageName - The name of the npm package.
 * @returns {Promise<Record<DistTag, Version>>} A promise that resolves to an object containing the distribution tags.
 * @throws Will throw an error if the execution of the npm view command fails.
 */
async function getDistTagsObject(packageName) {
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

/**
 * Checks if a specific version of a given npm package is deprecated.
 * @param {string} packageName - The name of the npm package.
 * @param {string} version - The version of the npm package.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the version is deprecated.
 * @throws Will throw an error if the execution of the npm view command fails.
 */
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

/**
 * Fetches the non-deprecated versions of a given npm package.
 * @param {string} packageName - The name of the npm package.
 * @returns {Promise<{tag: string, version: string, major: string}[]>} A promise that resolves to an array containing the non-deprecated versions.
 */
async function getLastNonDeprecatedVersions(packageName) {
  const distTagsObject = await getDistTagsObject(packageName);
  const nonDeprecatedVersionsObject = {};

  for (const [tag, version] of Object.entries(distTagsObject)) {
    const deprecated = await isDeprecated(packageName, version);
    if (!deprecated) {
      nonDeprecatedVersionsObject[tag] = version;
    }
  }
  const yearlyReleasePattern = /^y\d{4}-lts$/;
  let yearlyReleaseVersions = Object.entries(distTagsObject)
    .filter(([key, _]) => yearlyReleasePattern.test(key))
    .slice(0, 3);
  if (yearlyReleaseVersions.length < 3 && distTagsObject['1018.0-lts']) {
    yearlyReleaseVersions.push(['1018.0-lts', distTagsObject['1018.0-lts']]);
  }

  return yearlyReleaseVersions.map(([tag, version]) => ({
    tag,
    version,
    major: version.split('.')[0],
  })).slice(0,1); // TODO: remove slice, debug purposes only
}

/**
 * Returns list of last three, non-deprecated versions of @c8y/ngx-components package.
 */
(async () => {
  const packageName = '@c8y/ngx-components';
  const nonDeprecatedVersions = await getLastNonDeprecatedVersions(packageName);
  process.stdout.write(
    `::set-output name=non_deprecated_shell_versions::${JSON.stringify(
      nonDeprecatedVersions
    )}`
  );
})();
