const AWSXray = require("aws-xray-sdk")
const util = require("util")
const fs = require("fs")
const Mustache = require("mustache")
const http = require("../lib/http")
const aws4 = require("../lib/aws4")
const log = require("../lib/log")
const URL = require("url")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")
const flushMetrics = require("../middleware/flush-metrics")
const correlationIds = require("../middleware/capture-correlation-ids")
const cloudwatch = require("../lib/cloudwatch")

const awsRegion = process.env.AWS_REGION
const cognitoUserPoolId = process.env.cognito_user_pool_id
const cognitoClientId = process.env.cognito_client_id
const restaurantsApiRoot = process.env.restaurants_api
const ordersApiRoot = process.env.orders_api

const readFileAsync = util.promisify(fs.readFile)
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

let htmlCache

const loadHTML = async () => {
  if (!htmlCache) {
    htmlCache = await readFileAsync("static/index.html", "utf-8")
  }
  return htmlCache
}

const getRestaurants = async () => {
  const url = URL.parse(restaurantsApiRoot)
  const opts = {
    host: url.hostname,
    path: url.pathname
  }

  aws4.sign(opts)

  const httpReq = http({
    uri: restaurantsApiRoot,
    method: "get",
    headers: opts.headers
  })

  return new Promise((resolve, reject) => {
    const f = async subsegment => {
      subsegment.addMetadata("url", restaurantsApiRoot)

      try {
        const resp = await httpReq
        subsegment.close()
        resolve(resp.body)
      } catch (err) {
        subsegment.close(err)
        reject(err)
      }
    }
    const segment = AWSXray.getSegment()
    AWSXray.captureAsyncFunc("getting restaurants", f, segment)
  })
}

const handler = async (event, context, callback) => {
  await aws4.init()
  const template = await loadHTML()

  log.debug("loaded html template")

  const restaurants = await cloudwatch.trackExecTime(
    "GetRestaurantsLatency",
    () => getRestaurants()
  )
  log.debug(`loaded ${restaurants.length} restaurants`)
  const dayOfWeek = DAYS[new Date().getDay()]
  const view = {
    dayOfWeek,
    restaurants,
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    searchUrl: `${restaurantsApiRoot}/search`,
    placeOrderUrl: `${ordersApiRoot}`
  }
  const html = Mustache.render(template, view)
  log.debug(`generated html ${html.length} bytes`)
  cloudwatch.incrCount("RestaurantsReturned", restaurants.length)
  const response = {
    statusCode: 200,
    body: html,
    headers: {
      "content-type": "text/html; charset=UTF-8"
    }
  }

  callback(null, response)
}

module.exports.handler = middy(handler)
  .use(correlationIds({sampleDebugLogRate: 1}))
  .use(sampleLogging({sampleRate: 1}))
  .use(flushMetrics)
