const AWS = require('aws-sdk');
const async = require('async');
const argv = require('minimist')(process.argv.slice(2));

AWS.config.update({ region: 'us-east-1' });

const queues = argv._;

if (queues.length === 0) {
  console.error('Usage: node create_queues.js <QUEUE_NAME> ...');
  process.exit(1);
}

const sqs = new AWS.SQS();

async.each(queues, (queue, cb) => {
  sqs.createQueue({ QueueName: queue }, (err, data) => {
    if (!err) {
      console.log(`Created queue ${queue} at ${data.QueueUrl}`);
    }
    cb(err);
  });
}, (err) => {
  if (err) {
    console.log(err);
  }
});
