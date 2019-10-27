const _ = require("lodash")
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const captureCorrelationIds = require("../middleware/capture-correlation-ids")

const kinesis = require("../lib/kinesis")
const sns = require("../lib/sns")
const streamName = process.env.order_events_stream
const topicArn = process.env.user_notification_topic

const handler = async (event, context, cb) => {
  const records = context.parsedKinesisEvents

  const orderAccepted = records.filter(r => r.eventType === "order_accepted")

  for (const order of orderAccepted) {
    order.scopeToThis()
    const snsReq = {
      Message: JSON.stringify(order),
      TopicArn: topicArn
    }
    await sns.publish(snsReq).promise()
    log.debug(`notified user of order accepted...`, {
      userEmail: order.userEmail,
      orderId: order.orderId
    })

    const data = {...order, eventType: "user_notified"}

    const kinesisReq = {
      Data: JSON.stringify(data), // the SDK would base64 encode this for us
      PartitionKey: order.orderId,
      StreamName: streamName
    }
    await kinesis.putRecord(kinesisReq).promise()
    log.debug(`published 'user_notified' event to Kinesis`, {
      orderId: order.orderId
    })

    order.unscope()
  }

  cb(null, "all done")
}

module.exports.handler = middy(handler)
  .use(captureCorrelationIds({sampleDebugLogRate: 0.01}))
  .use(sampleLogging({sampleRate: 0.01}))
