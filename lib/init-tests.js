const Promise = require("bluebird")
const aws4 = require("./aws4")

let initialized = false

const initTests = async () => {
  if (initialized) {
    return
  }

  process.env.restaurants_api =
    "https://65lbw6a68l.execute-api.us-east-1.amazonaws.com/dev/restaurants"
  process.env.cognito_user_pool_id = "us-east-1_9zfVQJGMO"
  process.env.cognito_client_id = "3kjhqi44gnci7mfjraijfua11k"
  process.env.restaurants_table = "restaurants"
  process.env.AWS_REGION = "us-east-1"
  process.env.cognito_user_pool_id = "us-east-1_9zfVQJGMO"
  process.env.cognito_client_id = "test_cognito_client_id"
  process.env.cognito_server_client_id = "2nf34svdri72l3j3u4uclir5ka"

  await aws4.init()

  initialized = true
}

module.exports.initTests = initTests
