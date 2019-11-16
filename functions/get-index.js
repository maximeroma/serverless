const AWSXray = require("aws-xray-sdk");
const util = require("util");
const fs = require("fs");
const Mustache = require("mustache");
const http = require("../lib/http");
const aws4 = require("../lib/aws4");
const log = require("../lib/log");
const URL = require("url");
const { ssm } = require("middy/middlewares");
const flushMetrics = require("../middleware/flush-metrics");
const wrapper = require("../middleware/wrapper");
const cloudwatch = require("../lib/cloudwatch");

const awsRegion = process.env.AWS_REGION;
const STAGE = process.env.STAGE;

const readFileAsync = util.promisify(fs.readFile);
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

let htmlCache;

const loadHTML = async () => {
  if (!htmlCache) {
    htmlCache = await readFileAsync("static/index.html", "utf-8");
  }
  return htmlCache;
};

const getRestaurants = async restaurantsApiRoot => {
  const url = URL.parse(restaurantsApiRoot);
  const opts = {
    host: url.hostname,
    path: url.pathname
  };

  aws4.sign(opts);

  const httpReq = http({
    uri: restaurantsApiRoot,
    method: "get",
    headers: opts.headers
  });

  return new Promise((resolve, reject) => {
    const f = async subsegment => {
      subsegment.addMetadata("url", restaurantsApiRoot);

      try {
        const resp = await httpReq;
        subsegment.close();
        resolve(resp.body);
      } catch (err) {
        subsegment.close(err);
        reject(err);
      }
    };
    const segment = AWSXray.getSegment();
    AWSXray.captureAsyncFunc("getting restaurants", f, segment);
  });
};

const handler = async (event, context, callback) => {
  await aws4.init();
  const template = await loadHTML();

  log.debug("loaded html template");

  const restaurants = await cloudwatch.trackExecTime(
    "GetRestaurantsLatency",
    () => getRestaurants(context.restaurants_api)
  );
  log.debug(`loaded ${restaurants.length} restaurants`);
  const dayOfWeek = DAYS[new Date().getDay()];
  const view = {
    dayOfWeek,
    restaurants,
    awsRegion,
    cognitoUserPoolId: context.cognito_user_pool_id,
    cognitoClientId: context.cognito_client_id,
    searchUrl: `${context.restaurants_api}/search`,
    placeOrderUrl: `${context.orders_api}`
  };
  const html = Mustache.render(template, view);
  log.debug(`generated html ${html.length} bytes`);
  cloudwatch.incrCount("RestaurantsReturned", restaurants.length);
  const response = {
    statusCode: 200,
    body: html,
    headers: {
      "content-type": "text/html; charset=UTF-8"
    }
  };

  callback(null, response);
};

module.exports.handler = wrapper(handler)
  .use(flushMetrics)
  .use(
    ssm({
      cache: true,
      cacheExpiryInMillis: 3 * 60 * 1000,
      setToContext: true,
      names: {
        restaurants_api: `/bigmouth/${STAGE}/restaurants_api`,
        orders_api: `/bigmouth/${STAGE}/orders_api`,
        cognito_client_id: `/bigmouth/${STAGE}/cognito_client_id`,
        cognito_user_pool_id: `/bigmouth/${STAGE}/cognito_user_pool_id`
      }
    })
  );
