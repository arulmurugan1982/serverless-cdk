const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const bucketName = process.env.BUCKET;

exports.mainV2 = async function(event, context) {
  try {
    event.Records.forEach((record) => {
        console.log('Record: %j', record);
      });
  } catch(error) {
    return {
      statusCode: 400,
        headers: {},
        body: JSON.stringify("Test")
    }
  }
}
