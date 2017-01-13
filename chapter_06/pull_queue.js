const AWS = require('aws-sdk');
const async = require('async');
const argv = require('minimist')(process.argv.slice(2));

AWS.config.update({ region: 'us-east-1' });

if (argv._.length !== 1) {
  console.error('Usage: node pull_queue.js <QUEUE_URL>');
  process.exit(1);
}

const sqs = new AWS.SQS();

const queueUrl = argv._[0];

async.doWhilst((callback) => {
  sqs.receiveMessage({
    QueueUrl: queueUrl
  }, (err, data) => {
    if (err) callback(err);
    else {
      async.each(data.Messages || [], (message, cb) => {
        console.log(`Message: '${message.Body}'`);
        sqs.deleteMessage({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle
        }, cb);
      }, (err) => {
        setTimeout(() => callback(err), 1000);
      });
    }
  });
}, () => true, err => console.log(err));
