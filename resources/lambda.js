const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const layer = require('/opt/sharedExample');

const bucketName = process.env.BUCKET;

exports.main = async function(event, context) {
  try {
      console.log("Entering Lambda FreightWise!")    ;
      const data = await S3.listObjectsV2({ Bucket: bucketName }).promise();
      console.log(data)
  } catch(error) {
    return {
      statusCode: 400,
        headers: {},
        body: JSON.stringify("FreightWise")
    }
  }
}
