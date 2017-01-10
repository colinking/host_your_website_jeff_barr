
const async = require('async');
const config = require('./config');

module.exports.getBucketObjects = (s3, options, callback) => {
  const bucketName = options.bucketName || config.DEFAULT_BUCKET;
  const prefix = options.prefix || '';
  const objects = [];
  let isTruncated = true;
  let token = '';

  async.whilst(
    () => isTruncated,
    (cb) => {
      s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: (token || undefined)
      }, (err, data) => {
        if (err) {
          cb(err);
        } else {
          isTruncated = data.IsTruncated;
          token = data.NextContinuationToken;

          data.Contents.forEach((object) => {
            objects.push(object);
          });

          cb();
        }
      });
    },
    (err) => {
      if (err) {
        console.error('Error retrieiving bucket list.');
        callback(err);
      } else {
        callback(null, objects);
      }
    }
  );
};
