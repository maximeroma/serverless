const notify = require("../lib/notify")

module.exports.handler = async (event, context, cb) => {
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
