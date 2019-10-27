const sns = require("../lib/sns")
const restaurantRetryTopicArn = process.env.restaurant_notification_retry_topic
const cloudwatch = require("../lib/cloudwatch")
const log = require("../lib/log")

const retryRestaurantNotification = async order => {
  const pubReq = {
    Message: JSON.stringify(order),
    TopicArn: restaurantRetryTopicArn
  }
  await cloudwatch.trackExecTime("SnsPublishLatency", () =>
    sns.publish(pubReq).promise()
  )

  log.debug(`queued restaurant notification for retry...`, {
    order: order.orderId
  })
  cloudwatch.incrCount("NotifyRestaurantQueued")
}

module.exports = {
  restaurantNotification: retryRestaurantNotification
}
