const AWS = require('aws-sdk');
const async = require('async');
const request = require('request');
const cheerio = require('cheerio');
const config = require('./config');
const helpers = require('./helpers');

AWS.config.update({ region: 'us-east-1' });

const sqs = new AWS.SQS();

function getQueues(callback) {
  helpers.findQueueURL(sqs, config.PARSE_QUEUE, (err, parseQueue) => {
    if (err) callback(err);
    else {
      helpers.findQueueURL(sqs, config.IMAGE_QUEUE, (err, imageQueue) => {
        callback(err, parseQueue, imageQueue);
      });
    }
  });
}

function fetchImages(s3Url, callback) {
  request(s3Url, (err, response, body) => {
    if (err) callback(err);
    else {
      const $ = cheerio.load(body);
      const pageTitle = $('title').text();
      const imageURLs = [];
      $('img').each((i, image) => {
        const src = $(image).attr('src');
        if (/^https?:\/\//.test(src) && imageURLs.length < 16) {
          console.log(`Found absolute URL '${src}'`);
          imageURLs.push(src);
        }
      });
      callback(null, pageTitle, imageURLs);
    }
  });
}

getQueues((err, parseQueue, imageQueue) => {
  if (err) console.log(err);
  else {
    async.doWhilst((callback) => {
      helpers.pullMessage(sqs, parseQueue, (err, message) => {
        if (err) callback(err);
        else {
          const s3Url = message.messageDetail.data;
          fetchImages(s3Url, (err, pageTitle, imageURLs) => {
            if (err) callback(err);
            else {
              const history = message.messageDetail.history;
              history.push(`Processed by parse_page.js at ${(new Date()).toISOString()}`);
              const imageMessage = {
                action: 'FetchImages',
                origin: message.messageDetail.origin,
                data: imageURLs,
                pageTitle,
                history
              };
              sqs.sendMessage({
                QueueUrl: imageQueue,
                MessageBody: JSON.stringify(imageMessage)
              }, (err) => {
                if (!err) {
                  console.log('Sent page to image fetcher');
                  sqs.deleteMessage({
                    QueueUrl: parseQueue,
                    ReceiptHandle: message.receiptHandle
                  }, (err) => {
                    if (!err) console.log('Deleted message from parse queue');
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
