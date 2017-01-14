const AWS = require('aws-sdk');
const async = require('async');
const argv = require('minimist')(process.argv.slice(2));
const config = require('./config');
const helpers = require('./helpers');

AWS.config.update({ region: 'us-east-1' });

const urls = argv._;

if (urls.length === 0) {
  console.error('Usage: node load_crawl_urls.js <URL...>');
  process.exit(1);
}

const sqs = new AWS.SQS();
helpers.findQueueURL(sqs, config.URL_QUEUE, (err, queueURL) => {
  async.each(urls, (url, cb) => {
    const message = {
      action: 'FetchPage',
      origin: 'load_crawl_urls.js',
      data: url,
      history: [`Posted by load_crawl_urls.js on ${(new Date()).toISOString()}`]
    };
    sqs.sendMessage({
      QueueUrl: queueURL,
      MessageBody: JSON.stringify(message)
    }, (err) => {
      if (!err) {
        console.log(`Posted '${JSON.stringify(message)}' to '${queueURL}'.`);
      }
      cb(err);
    });
  }, (err) => {
    if (err) console.log(err);
  });
});
