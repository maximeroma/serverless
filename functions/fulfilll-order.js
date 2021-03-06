const kinesis = require("../lib/kinesis")
const log = require("../lib/log")
const middy = requrie("middy")
const sampleLogging = require("../middleware/sample-logging")
const captureCorrelationIds = require("../middleware/capture-correlation-ids")

const streamName = process.env.order_events_stream

handler = async (event, context, cb) => {
  const body = JSON.parse(event.body)
  const restaurantName = body.restaurantName
  const orderId = body.orderId
  const userEmail = body.userEmail

  log.debug(`restaurant has fulfilled order ID from user...`, {
    restaurantName,
    orderId,
    userEmail
  })

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_fulfilled"
  }

  const req = {
    Data: JSON.stringify(data), // the SDK would base64 encode this for us
    PartitionKey: orderId,
    StreamName: streamName
  }

  await kinesis.putRecord(req).promise()

  log.debug(`published 'order_fulfilled' event into Kinesis`)

  const response = {
    statusCode: 200,
    body: JSON.stringify({orderId})
  }

  cb(null, response)
}

module.exports.handler = middy(handler)
  .use(captureCorrelationIds({sampleDebugLogRate: 0.01}))
  .use(sampleLogging({sampleRate: 0.01}))
