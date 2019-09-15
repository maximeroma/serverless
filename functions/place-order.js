const AWS = require("aws-sdk")
const chance = require("chance").Chance()
const kinesis = new AWS.Kinesis()
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const streamName = process.env.order_events_stream

const handler = async (event, context, cb) => {
  const body = JSON.parse(event.body)
  log.debug("request body is a valid JSON", {requestBody: event.body})
  const {restaurantName} = body
  const {email: userEmail} = event.requestContext.authorizer.claims
  const orderId = chance.guid()
  log.debug(`placing order...`, {orderId, restaurantName, userEmail})

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
  await kinesis.putRecord(putReq).promise()

  log.debug("published event to kinesis...", {eventName: "order_placed"})

  const response = {
    body: JSON.stringify({orderId}),
    statusCode: 200
  }

  cb(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
