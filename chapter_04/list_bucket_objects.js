const AWS = require('aws-sdk');
const config = require('./config');

const s3 = new AWS.S3();

s3.listObjectsV2({ Bucket: config.BOOK_BUCKET }, (err, data) => {
  if (err) {
    console.error('Error retrieiving bucket list.');
    console.error(err);
  } else {
    data.Contents.forEach((object) => {
      console.log(object.Key);
    });
  }
});
