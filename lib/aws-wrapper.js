const AWSXray = require("aws-xray-sdk")
const AWS = require("aws-sdk")

const awsWrapper = "TEST_MODE" in process.env ? AWS : AWSXray.captureAWS(AWS)
module.exports = awsWrapper
