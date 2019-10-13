const co = require("co")
const AWSXray = require("aws-xray-sdk")
const AWS = AWSXray.captureAWS(require("aws-sdk"))
const dynamodb = new AWS.DynamoDB.DocumentClient()
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")

const defaultResults = process.env.defaultResults || 8
const tablename = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  const req = {
    TableName: tablename,
    Limit: count,
    FilterExpression: "contains(themes, :theme)",
    ExpressionAttributeValues: {":theme": theme}
  }

  const resp = await dynamodb.scan(req).promise()

  return resp.Items
}

const handler = async (event, context, cb) => {
  const req = JSON.parse(event.body)
  const restaurants = await findRestaurantsByTheme(req.theme, defaultResults)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  cb(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
