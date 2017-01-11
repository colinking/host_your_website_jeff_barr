const AWS = require('aws-sdk');
const async = require('async');
const mime = require('mime');
const config = require('./config');
const helpers = require('./helpers');
const argv = require('minimist')(process.argv.slice(2));
const sharp = require('sharp');

if (argv.help) {
  console.error('Usage: node thumbnail_bucket.js --in=<BUCKET_NAME> --out=<BUCKET_NAME>');
  process.exit(1);
}

const bucketInName = argv.in || config.DEFAULT_BUCKET;
const bucketOutName = argv.out || bucketInName + config.THUMB_BUCKET_SUFFIX;

const s3 = new AWS.S3();

helpers.getBucketObjects(s3, {
  bucketName: bucketInName
}, (err, objects) => {
  if (err) {
    console.error(err);
  } else {
    const images = /^image\//;
    async.each(objects, (object) => {
      if (images.test(mime.lookup(object.Key))) {
        console.log(`Found image: ${object.Key}`);
        s3.getObject({
          Bucket: bucketInName,
          Key: object.Key
        }, (err, data) => {
          if (err) {
            console.error(err);
          } else {
            sharp(data.Body)
              .resize(config.THUMB_SIZE)
              .toBuffer()
              .then((thumbnail) => {
                helpers.uploadObject(s3, bucketOutName, object.Key, thumbnail, {
                  acl: 'public-read'
                }, (err, resp) => {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log(resp);
                  }
                });
              })
              .catch(err => console.error(err));
          }
        });
      }
    });
  }
});
