const co = require("co")
const AWS = require("aws-sdk")
const dynamodb = new AWS.DynamoDB.DocumentClient()
const log = require("../lib/log")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")

const defaultResults = process.env.defaultResults || 8
const tablename = process.env.restaurants_table

const getRestaurants = async count => {
  const req = {TableName: tablename, Limit: count}

  const resp = await dynamodb.scan(req).promise()

  return resp.Items
}

const handler = async (event, context, cb) => {
  const restaurants = await getRestaurants(defaultResults)
  log.debug(`fetched ${restaurants.length} restaurants`)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  cb(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
