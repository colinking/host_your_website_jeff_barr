const AWS = require('aws-sdk');
const config = require('./config');

if (process.argv.length < 2 || process.argv.length > 3) {
  console.error('Usage: node create_bucket.js <BUCKET_NAME>');
  process.exit(1);
}

const bucketName = (process.argv.length === 2 ? config.DEFAULT_BUCKET : process.argv[2]);

const s3 = new AWS.S3();

s3.createBucket({ Bucket: bucketName }, (err, data) => {
  if (err) {
    console.error(`Error creating bucket ${bucketName}`);
    console.error(err);
  } else {
    console.error(`${bucketName} bucket created`);
    console.log(data);
  }
});
