BUILD_VERSION=$1;
BUILD_LOCATION="dist";

mkdir -p ${BUILD_LOCATION}
cd ${BUILD_LOCATION}
unzip ../build.zip
rm ../build.zip
mv cumulocity.json cumulocity.tmp.json;
cat cumulocity.tmp.json | BUILD_VERSION="${BUILD_VERSION}" jq '.version = env.BUILD_VERSION' > cumulocity.json;
rm cumulocity.tmp.json;
zip -r -q ../community-widgets-${BUILD_VERSION}.zip *
cd ..
rm -r ${BUILD_LOCATION}
