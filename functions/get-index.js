const util = require("util")
const fs = require("fs")
const Mustache = require("mustache")
const http = require("superagent")
const aws4 = require("../lib/aws4")
const log = require("../lib/log")
const URL = require("url")
const middy = require("middy")
const sampleLogging = require("../middleware/sample-logging")

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

  const httpReq = http
    .get(restaurantsApiRoot)
    .set("Host", opts.headers["Host"])
    .set("X-Amz-Date", opts.headers["X-Amz-Date"])
    .set("Authorization", opts.headers["Authorization"])

  if (opts.headers["X-Amz-Security-Token"]) {
    httpReq.set("X-Amz-Security-Token", opts.headers["X-Amz-Security-Token"])
  }
  const resp = await httpReq

  return resp.body
}

const handler = async (event, context, callback) => {
  await aws4.init()
  const template = await loadHTML()
  log.debug("loaded html template")
  const restaurants = await getRestaurants()
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
  const response = {
    statusCode: 200,
    body: html,
    headers: {
      "content-type": "text/html; charset=UTF-8"
    }
  }

  callback(null, response)
}

module.exports.handler = middy(handler).use(sampleLogging({sampleRate: 0.01}))
