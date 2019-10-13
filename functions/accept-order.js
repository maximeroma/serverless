const AWSXray = require("aws-xray-sdk")
const AWS = AWSXray.captureAWS(require("aws-sdk"))
const kinesis = new AWS.Kinesis()
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")

const streamName = process.env.order_events_stream

const handler = async (event, context, cb) => {
  const body = JSON.parse(event.body)
  const restaurantName = body.restaurantName
  const orderId = body.orderId
  const userEmail = body.userEmail

  log.debug(`restaurant accepted order ID from user`, {
    restaurantName,
    orderId,
    userEmail
  })

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_accepted"
  }

  const req = {
    Data: JSON.stringify(data), // the SDK would base64 encode this for us
    PartitionKey: orderId,
    StreamName: streamName
  }

  await kinesis.putRecord(req).promise()

  log.debug(`published 'order_accepted' event into Kinesis`)

  const response = {
    statusCode: 200,
    body: JSON.stringify({orderId})
  }

  cb(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
