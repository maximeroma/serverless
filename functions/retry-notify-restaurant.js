const notify = require("../lib/notify")
const middy = require("middy")
const samplaLogging = require("../middleware/sample-logging")

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

module.exports.handler = middy(handler).use(samplaLogging({sampleRate: 0.01}))
