const AWS = require('aws-sdk');
const async = require('async');
const mime = require('mime');
const fs = require('fs');
const config = require('./config');
const helpers = require('./helpers');
const argv = require('minimist')(process.argv.slice(2));

const bucketName = argv.bucket || config.DEFAULT_BUCKET;
const files = argv._;

if (files.length === 0) {
  console.error('Usage: node upload_file.js [--bucket=<BUCKET_NAME>] <FILE_NAME> ...');
  process.exit(1);
}

const s3 = new AWS.S3();

async.each(files, (file, cb) => {
  const contentType = mime.lookup(file);
  fs.readFile(file, (fileErr, data) => {
    if (fileErr) {
      console.error(`Failed to read file: ${file}`);
      cb(fileErr);
    } else {
      helpers.uploadObject(s3, bucketName, file, data, { acl: 'public-read', contentType }, (err, resp) => {
        if (!err) {
          console.log(`${file} uploaded successfully to ${resp.Location}`);
        }
        cb(err);
      });
    }
  });
});
