const express = require('express');
const AWS = require('aws-sdk');

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

module.exports = router;
