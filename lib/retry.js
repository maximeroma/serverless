const AWS = require("aws-sdk")
const sns = new AWS.SNS()
const restaurantRetryTopicArn = process.env.restaurant_notification_retry_topic

const retryRestaurantNotification = async order => {
  const pubReq = {
    Message: JSON.stringify(order),
    TopicArn: restaurantRetryTopicArn
  }
  await sns.publish(pubReq).promise()

  console.log(
    `order [${order.orderId}]: queued restaurant notification for retry`
  )
}

module.exports = {
  restaurantNotification: retryRestaurantNotification
}
