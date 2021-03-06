
const async = require('async');
const mime = require('mime');
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

module.exports.uploadObject = (s3, bucketName, key, data, options, callback) => {
  const acl = options.acl || 'private';
  const contentType = options.contentType || mime.lookup(key) || 'text/plain';
  // Attempt the upload up to six times with exponential backoff before failing
  async.retry(
    // options
    {
      times: 6,
      // 100ms, 200ms, 400ms...
      interval: retryCount => 50 * (2 ** (retryCount)),
      errorFilter: err => err.retryable
    },
    // task
    (cb) => {
      s3.upload({
        Bucket: bucketName,
        Key: key,
        Body: data,
        ACL: acl,
        ContentType: contentType
      }, (err, resp) => {
        cb(err, resp);
      });
    },
    // callback
    (err, resp) => {
      if (err) {
        console.error(`Error uploading object for bucket ${bucketName} and key ${key}`);
        callback(err);
      } else {
        callback(err, resp);
      }
    }
  );
};

module.exports.findDistributionForBucket = (cf, bucketName, callback) => {
  cf.listDistributions({}, (err, distributions) => {
    if (err) {
      callback(err);
    } else {
      async.detect(distributions.DistributionList.Items,
        (distribution, cb) =>
          cb(null, distribution.Origins.Items[0].DomainName.startsWith(`${bucketName}.`)),
        callback);
    }
  });
};
