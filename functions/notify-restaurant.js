const AWS = require("aws-sdk")
const kinesis = new AWS.Kinesis()
const sns = new AWS.SNS()
const {getRecords} = require("../lib/kinesis")
const streamName = process.env.order_events_stream
const topicArn = process.env.restaurant_notification_topic

module.exports.handler = async (event, context, cb) => {
  const records = getRecords(event)
  console.log("records", records)
  const orderPlaced = records.filter(r => r.eventType === "order_placed")

  for (const order of orderPlaced) {
    const pubReq = {
      Message: JSON.stringify(order),
      TopicArn: topicArn
    }
    await sns.publish(pubReq).promise()

    console.log(
      `notified restaurant [${order.restaurantName}] of order [${order.orderId}]`
    )

    const data = {...order, EventType: "restaurant_notified"}

    const putRecordReq = {
      Data: JSON.stringify(data),
      PartitionKey: data.orderId,
      StreamName: streamName
    }
    await kinesis.putRecord(putRecordReq).promise()

    console.log(`published 'restaurant_notified' event to Kinesis`)
  }

  cb(null, "all done")
}
