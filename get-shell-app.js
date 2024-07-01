const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const shellVersion = process.env.VERSION;
console.log(`Shell version is: ${shellVersion}`);

// Construct the file URL
const fileUrl = `http://resources.cumulocity.com/webapps/ui-releases/apps-${shellVersion}.tgz`;
console.log(`Shell file url is: ${fileUrl}`);

// Download the file
async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  try {
    const tgzFile = `apps-${shellVersion}.tgz`;
    await downloadFile(fileUrl, tgzFile);
    if (!fs.existsSync(tgzFile)) {
      throw new Error('Downloaded file not found!');
    }
    console.log("File downloaded successfully.");

    // Extract the downloaded tar.gz file
    execSync(`tar -xzf ${tgzFile}`);
    console.log("Apps extracted successfully.");

    // Unzip Cockpit to dist/apps
    const cockpitFile = `cockpit-${shellVersion}.zip`;
    const destinationFolder = path.join('dist', 'apps', 'cockpit');

    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    execSync(`unzip -qq ${cockpitFile} -d ${destinationFolder}`);
    console.log("Cockpit extracted successfully.");

    // Echo the elements of dist/apps
    const distAppsContents = fs.readdirSync(path.join('dist', 'apps'));
    console.log("Contents of dist/apps:", distAppsContents);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
