const express = require('express');
const AWS = require('aws-sdk');
const numeral = require('numeral');
const async = require('async');

const helpers = require('./helpers');
const config = require('./config');

const router = express.Router();
const s3 = new AWS.S3();
const cf = new AWS.CloudFront();

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
  const bucketNameThumbs = (bucketName.endsWith(config.THUMB_BUCKET_SUFFIX)
    ? bucketName
    : bucketName + config.THUMB_BUCKET_SUFFIX);
  async.parallel({
    // Fetch CloudFront distributions
    bucket_dist: cb => helpers.findDistributionForBucket(cf, bucketName, cb),
    thumbs_dist: cb => helpers.findDistributionForBucket(cf, bucketNameThumbs, cb),
    // Fetch all objects from each bucket
    bucket_objects: cb => helpers.getBucketObjects(s3, { bucketName }, cb),
    thumbs_objects: cb => helpers.getBucketObjects(s3, { bucketName: bucketNameThumbs }, cb),
  }, (err, results) => {
    if (err) {
      res.render('error', {
        message: 'Error retrieiving CloudFront distributions or bucket objects.',
        error: err
      });
    } else {
      const thumbs = {};
      results.thumbs_objects.forEach((object) => {
        thumbs[object.Key] = (results.thumbs_dist
          ? `https://${results.thumbs_dist.DomainName}/${object.Key}`
          : s3.getSignedUrl('getObject', { Bucket: bucketNameThumbs, Key: object.Key }));
      });

      const fileList = [];
      results.bucket_objects.forEach((object) => {
        const url = (results.bucket_dist
          ? `https://${results.bucket_dist.DomainName}/${object.Key}`
          : s3.getSignedUrl('getObject', { Bucket: bucketName, Key: object.Key }));
        fileList.push({
          url,
          thumb: thumbs[object.Key],
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
