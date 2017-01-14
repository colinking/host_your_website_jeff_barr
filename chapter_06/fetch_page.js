const AWS = require('aws-sdk');
const async = require('async');
const request = require('request');
const crypto = require('crypto');
const config = require('./config');
const helpers = require('./helpers');
const s3helpers = require('../chapter_04/helpers');
const s3config = require('../chapter_04/config');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

function getQueues(callback) {
  helpers.findQueueURL(sqs, config.URL_QUEUE, (err, urlQueue) => {
    if (err) callback(err);
    else {
      helpers.findQueueURL(sqs, config.PARSE_QUEUE, (err, parseQueue) => {
        callback(err, urlQueue, parseQueue);
      });
    }
  });
}

function storeHTMLtoS3(url, callback) {
  console.log(`Processing URL '${url}':`);
  request(url, (err, response, body) => {
    if (err) callback(err);
    else {
      console.log(`Retrieved ${body.length} bytes of HTML.`);
      const md5 = crypto.createHash('md5').update(url).digest('hex');
      const key = `page_${md5}.html`;
      s3helpers.uploadObject(s3, s3config.DEFAULT_BUCKET, key, body, { acl: 'public-read' }, (err, resp) => {
        if (err) callback(err);
        else {
          console.log(`Uploaded page to S3 as '${key}'`);
          callback(null, resp.Location);
        }
      });
    }
  });
}

getQueues((err, urlQueue, parseQueue) => {
  if (err) console.log(err);
  else {
    async.doWhilst((callback) => {
      helpers.pullMessage(sqs, urlQueue, (err, message) => {
        if (err) callback(err);
        else {
          const url = message.messageDetail.data;
          storeHTMLtoS3(url, (err, s3Url) => {
            if (err) callback(err);
            else {
              const history = message.messageDetail.history;
              history.push(`Fetched by fetch_page.js at ${(new Date()).toISOString()}`);
              const parseMessage = {
                action: 'ParsePage',
                origin: message.messageDetail.origin,
                data: s3Url,
                url,
                history
              };
              sqs.sendMessage({
                QueueUrl: parseQueue,
                MessageBody: JSON.stringify(parseMessage)
              }, (err) => {
                if (!err) {
                  console.log('Sent page to parser');
                  sqs.deleteMessage({
                    QueueUrl: urlQueue,
                    ReceiptHandle: message.receiptHandle
                  }, (err) => {
                    if (!err) console.log('Deleted message from URL queue');
                    callback(err);
                  });
                }
              });
            }
          });
        }
      });
    }, () => true, err => console.log(err));
  }
});
