const AWS = require("aws-sdk")

const notify = require("../lib/notify")
const retry = require("../lib/retry")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const flushMetrics = require("../middleware/flush-metrics")
const captureCorrelationIds = require("../middleware/capture-correlation-ids")

const handler = async (event, context, cb) => {
  const records = context.parsedKinesisEvents

  const orderPlaced = records.filter(r => r.eventType === "order_placed")

  for (const order of orderPlaced) {
    order.scopeToThis()
    try {
      await notify.restaurantOfOrder(order)
    } catch (e) {
      await retry.restaurantNotification(order)
    }

    order.unscope()
  }

  cb(null, "all done")
}

module.exports.handler = middy(handler)
  .use(captureCorrelationIds({sampleDebugLogRate: 0.01}))
  .use(sampleLogging({sampleRate: 0.01}))
  .use(flushMetrics)
