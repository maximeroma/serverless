const AWSXray = require("aws-xray-sdk")
const AWS = AWSXray.captureAWS(require("aws-sdk"))
const dynamodb = new AWS.DynamoDB.DocumentClient()
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const cloudwatch = require("../lib/cloudwatch")

const defaultResults = process.env.defaultResults || 8
const tablename = process.env.restaurants_table

const getRestaurants = async count => {
  const req = {TableName: tablename, Limit: count}

  const resp = await cloudwatch.trackExecTime("DynamoDBScanLatency", () =>
    dynamodb.scan(req).promise()
  )

  return resp.Items
}

const handler = async (event, context, cb) => {
  const restaurants = await getRestaurants(defaultResults)
  log.debug(`fetched ${restaurants.length} restaurants`)
  cloudwatch.incrCount("RestaurantsReturned", () => restaurants.length)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  cb(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
