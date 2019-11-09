const Promise = require("bluebird")
const aws4 = require("./aws4")
const AWS = require("./aws-wrapper")
const _ = require("lodash")

AWS.config.region = "us-east-1"

const SSM = new AWS.SSM()

let initialized = false

const getParameters = async keys => {
  const prefix = "/bigmouth/dev/"

  const req = {
    Names: keys.map(key => `${prefix}${key}`),
    WithDecryption: true
  }

  const resp = await SSM.getParameters(req).promise()

  return _.reduce(
    resp.Parameters,
    (obj, param) => {
      obj[param.Name.substr(prefix.length)] = param.Value

      return obj
    },
    {}
  )
}

const initTests = async () => {
  if (initialized) {
    return
  }

  const params = await getParameters([
    "cognito_client_id",
    "cognito_user_pool_id",
    "restaurants_api"
  ])
  console.log(params)

  process.env.restaurants_api = params.restaurants_api
  process.env.restaurants_table = "restaurants"
  process.env.AWS_REGION = "us-east-1"
  process.env.cognito_user_pool_id = params.cognito_user_pool_id
  process.env.cognito_client_id = params.cognito_client_id
  process.env.cognito_server_client_id = "4hhkrdujhq66ho00l54h9evho0"

  await aws4.init()

  initialized = true
}

module.exports.initTests = initTests
