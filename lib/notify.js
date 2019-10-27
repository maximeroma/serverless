const kinesis = require("../lib/kinesis")
const sns = require("../lib/sns")
const streamName = process.env.order_events_stream
const restaurantTopicArn = process.env.restaurant_notification_topic
const chance = require("chance").Chance()
const cloudwatch = require("../lib/cloudwatch")
const log = require("../lib/log")

const notifyRestaurantOfOrder = async order => {
  try {
    if (chance.bool({likelihood: 75})) {
      throw new Error("boom")
    }
    const pubReq = {
      Message: JSON.stringify(order),
      TopicArn: restaurantTopicArn
    }
    await cloudwatch.trackExecTime("SnsPublishLatency", () =>
      sns.publish(pubReq).promise()
    )

    log.debug(`notified restaurant of order ...`, {
      orderId: order.orderId,
      restaurantName: order.restaurantName
    })

    const data = {...order, eventType: "restaurant_notified"}

    const putRecordReq = {
      Data: JSON.stringify(data),
      PartitionKey: data.orderId,
      StreamName: streamName
    }
    await cloudwatch.trackExecTime("KinesisPutRecordLatency", () =>
      kinesis.putRecord(putRecordReq).promise()
    )

    log.debug(`published 'restaurant_notified' event to Kinesis...`)
    cloudwatch.incrCount("NotifyRestaurantSuccess")
  } catch (err) {
    cloudwatch.incrCount("NotifyRestaurantFailed")
    throw err
  }
}

module.exports = {
  restaurantOfOrder: notifyRestaurantOfOrder
}
