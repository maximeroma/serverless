const AWS = require("../lib/aws-wrapper")
const dynamodb = new AWS.DynamoDB.DocumentClient()
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const correlationIds = require("../middleware/capture-correlation-ids")
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
  cloudwatch.incrCount("RestaurantsReturned", restaurants.length)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  cb(null, response)
}

module.exports.handler = middy(handler)
  .use(correlationIds({sampleDebugLogRate: 0.9}))
  .use(sampleLogging({sampleRate: 1}))
