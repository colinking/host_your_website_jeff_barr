const AWS = require('aws-sdk');
const config = require('./config');

if (process.argv.length < 2 || process.argv.length > 3) {
  console.error('Usage: node list_bucket_objects.js <BUCKET_NAME>');
  process.exit(1);
}

const bucketName = (process.argv.length === 2 ? config.DEFAULT_BUCKET : process.argv[2]);

const s3 = new AWS.S3();

s3.listObjectsV2({ Bucket: bucketName }, (err, data) => {
  if (err) {
    console.error('Error retrieiving bucket list.');
    console.error(err);
  } else {
    data.Contents.forEach((object) => {
      console.log(object.Key);
    });
  }
});
