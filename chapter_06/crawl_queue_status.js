const AWS = require('aws-sdk');
const async = require('async');
const Table = require('cli-table');
const config = require('./config');
const helpers = require('./helpers');

AWS.config.update({ region: 'us-east-1' });

const sqs = new AWS.SQS();

async.map(config.QUEUES, (queueName, cb) => {
  helpers.findQueueURL(sqs, queueName, (err, queueURL) => {
    if (err) cb(err);
    else {
      sqs.getQueueAttributes({
        QueueUrl: queueURL,
        AttributeNames: ['All']
      }, (err, data) => {
        if (err) cb(err);
        else {
          cb(null, [queueName, data.Attributes.ApproximateNumberOfMessages]);
        }
      });
    }
  });
}, (err, results) => {
  if (err) console.log(err);
  else {
    const table = new Table({
      head: ['Queue Name', 'Visible Message Count']
    });
    table.push(...results);
    console.log(table.toString());
  }
});
