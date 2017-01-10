
const AWS = require('aws-sdk');
const config = require('./config');

const s3 = new AWS.S3();

s3.createBucket({ Bucket: config.BOOK_BUCKET }, (err, data) => {
  if (err) {
    console.error(`Error creating bucket ${config.BOOK_BUCKET}`);
    console.error(err);
  } else {
    console.error(`${config.BOOK_BUCKET} bucket created`);
    console.log(data);
  }
});
