const AWS = require('aws-sdk');
const async = require('async');
const argv = require('minimist')(process.argv.slice(2));

AWS.config.update({ region: 'us-east-1' });

if (argv._.length < 2) {
  console.error('Usage: node post_queue.js <QUEUE_URL> <ITEM...>');
  process.exit(1);
}

const sqs = new AWS.SQS();

const queueUrl = argv._[0];
const messages = argv._.slice(1);

async.each(messages, (message, cb) => {
  sqs.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: String(message)
  }, (err) => {
    if (!err) {
      console.log(`Posted '${message}' to queue URL ${queueUrl}.`);
    }
    cb(err);
  });
}, (err) => {
  if (err) {
    console.log(err);
  }
});
