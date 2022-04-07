const AWS = require('aws-sdk');


exports.shared = async function(event, context) {
  try {
      console.log("Entering Lambda Sharing!")

  } catch(error) {
    return {
      statusCode: 400,
        headers: {},
        body: JSON.stringify("Test")
    }
  }
}
