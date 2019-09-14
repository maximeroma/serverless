const AWS = require("aws-sdk")
const {getRecords} = require("../lib/kinesis")
const notify = require("../lib/notify")
const retry = require("../lib/retry")

module.exports.handler = async (event, context, cb) => {
  const records = getRecords(event)
  console.log("records", records)
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
