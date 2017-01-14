const async = require('async');

module.exports.findQueueURL = (sqs, queueName, callback) => {
  sqs.createQueue({ QueueName: queueName }, (err, data) => {
    if (err) callback(err);
    else callback(null, data.QueueUrl);
  });
};

module.exports.pullMessage = (sqs, queueURL, callback) => {
  async.doUntil((cb) => {
    sqs.receiveMessage({
      QueueUrl: queueURL,
      MaxNumberOfMessages: 1
    }, (err, data) => {
      if (err) cb(err);
      else if (!data.Messages || data.Messages.length === 0) setTimeout(cb, 1000);
      else {
        const message = data.Messages[0];
        cb(null, {
          queueURL,
          timestamp: (new Date()).toISOString(),
          message,
          messageBody: message.Body,
          messageDetail: JSON.parse(message.Body),
          receiptHandle: message.ReceiptHandle
        });
      }
    });
  }, message => message, callback);
};
