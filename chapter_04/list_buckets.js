const AWS = require('aws-sdk');

const s3 = new AWS.S3();

s3.listBuckets((err, data) => {
  if (err) {
    console.error('Error retrieiving bucket list.');
    console.error(err);
  } else {
    data.Buckets.forEach((bucket) => {
      console.log(bucket.Name);
    });
  }
});
