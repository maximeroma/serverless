const AWS = require("aws-sdk")
const {getRecords} = require("../lib/kinesis")
const notify = require("../lib/notify")
const retry = require("../lib/retry")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const flushMetrics = require("../middleware/flush-metrics")

const handler = async (event, context, cb) => {
  const records = getRecords(event)

  const orderPlaced = records.filter(r => r.eventType === "order_placed")

  for (const order of orderPlaced) {
    try {
      await notify.restaurantOfOrder(order)
    } catch (e) {
      await retry.restaurantNotification(order)
    }
  }

  cb(null, "all done")
}

module.exports.handler = middy(handler)
  .use(sampleLogging({sampleRate: 0.01}))
  .use(flushMetrics)
