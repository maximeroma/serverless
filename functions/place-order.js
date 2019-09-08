const AWS = require("aws-sdk")
const chance = require("chance").Chance()
const kinesis = new AWS.Kinesis()
const streamName = process.env.order_events_stream

module.exports.handler = async (event, context, cb) => {
  const {restaurantName} = JSON.parse(event.body)
  const {email: userEmail} = event.requestContext.authorizer.claims
  const orderId = chance.guid()
  console.log(
    `placing order ID [${orderId}] to [${restaurantName}] from user [${userEmail}]`
  )

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_placed"
  }
  const putReq = {
    Data: JSON.stringify(data),
    PartitionKey: orderId,
    StreamName: streamName
  }
  await kinesis.putRecord(putReq).promise()

  console.log('published "order_placed" event to kinesis')

  const response = {
    body: JSON.stringify({orderId}),
    statusCode: 200
  }

  cb(null, response)
}
