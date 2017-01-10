const express = require('express');
const AWS = require('aws-sdk');
const helpers = require('./helpers');
const numeral = require('numeral');

const router = express.Router();
const s3 = new AWS.S3();

router.get('/buckets', (req, res) => {
  s3.listBuckets((err, data) => {
    if (err) {
      res.render('error', {
        message: 'Error retrieiving bucket list.',
        error: err
      });
    } else {
      const buckets = [];
      data.Buckets.forEach((bucket) => {
        buckets.push(bucket.Name);
      });

      res.render('chapter_04/buckets', {
        title: 'List Buckets',
        buckets
      });
    }
  });
});

router.get('/buckets/:bucket/objects', (req, res) => {
  const bucketName = req.params.bucket;
  helpers.getBucketObjects(s3, { bucketName }, (err, objects) => {
    if (err) {
      res.render('error', {
        message: `Error retrieiving object list for bucket: ${bucketName}`,
        error: err
      });
    } else {
      const fileList = [];
      objects.forEach((object) => {
        const url = helpers.getObjectURL(bucketName, object.Key);
        fileList.push({
          url,
          name: object.Key,
          size: numeral(object.Size).format('0,0')
        });
      });

      res.render('chapter_04/objects', {
        title: 'Chapter 4 - List of S3 Objects in Bucket',
        bucketName,
        fileList
      });
    }
  });
});

module.exports = router;
