const notify = require("../lib/notify")
const middy = require("middy")
const samplaLogging = require("../middleware/sample-logging")
const flushMetrics = require("../middleware/flush-metrics")
const captureCorrelationIds = require("../middleware/capture-correlation-ids")

const handler = async (event, context, cb) => {
  const order = {
    ...JSON.parse(event.Records[0].Sns.Message),
    retried: true
  }

  try {
    notify.restaurantOfOrder(order)
    cb(null, "all done")
  } catch (err) {
    cb(err)
  }
}

module.exports.handler = middy(handler)
  .use(captureCorrelationIds({sampleDebugLogRate: 0.01}))
  .use(samplaLogging({sampleRate: 0.01}))
  .use(flushMetrics)
