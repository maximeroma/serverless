const co = require("co")
const AWS = require("aws-sdk")
const dynamodb = new AWS.DynamoDB.DocumentClient()

const defaultResults = process.env.defaultResults || 8
const tablename = process.env.restaurants_table

function* getRestaurants(count) {
  const req = {TableName: tablename, Limit: count}

  const resp = yield dynamodb.scan(req).promise()

  return resp.Items
}

module.exports.handler = co.wrap(function*(event, context, cb) {
  let restaurants = yield getRestaurants(defaultResults)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  cb(null, response)
})
