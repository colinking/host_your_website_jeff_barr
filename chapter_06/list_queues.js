const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const sqs = new AWS.SQS();

sqs.listQueues({}, (err, urls) => {
  if (err) {
    console.log(err);
  } else {
    console.log(urls.QueueUrls);
  }
});
