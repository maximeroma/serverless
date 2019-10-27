const AWSXray = require("aws-xray-sdk")
const AWS = AWSXray.captureAWS(require("aws-sdk"))
const chance = require("chance").Chance()
const kinesis = require("../lib/kinesis")
const cloudwatch = require("../lib/cloudwatch")
const log = require("../lib/log")
const correlationIds = require("../lib/correlation-ids")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const flushMetrics = require("../middleware/flush-metrics")
const captureCorrelationIds = require("../middleware/capture-correlation-ids")

const streamName = process.env.order_events_stream

const handler = async (event, context, cb) => {
  const body = JSON.parse(event.body)
  log.debug("request body is a valid JSON", {requestBody: event.body})
  const {restaurantName} = body
  const {email: userEmail} = event.requestContext.authorizer.claims
  const orderId = chance.guid()
  log.debug(`placing order...`, {orderId, restaurantName, userEmail})

  correlationIds.set("order-id", orderId)
  correlationIds.set("restaurant-name", restaurantName)
  correlationIds.set("user-email", userEmail)

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_placed"
  }
  const putReq = {
    Data: JSON.stringify(data),
    PartitionKey: orderId,
    StreamName: streamName
  }
  await cloudwatch.trackExecTime("KinesisPutRecordLatency", () =>
    kinesis.putRecord(putReq).promise()
  )

  log.debug("published event to kinesis...", {eventName: "order_placed"})

  const response = {
    body: JSON.stringify({orderId}),
    statusCode: 200
  }

  cb(null, response)
}

module.exports.handler = middy(handler)
  .use(captureCorrelationIds({sampleDebugLogRate: 0.5}))
  .use(sampleLogging({sampleRate: 0.01}))
  .use(flushMetrics)
