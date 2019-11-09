const cheerio = require("cheerio")
const AWSXray = require("aws-xray-sdk")
const {invoke_get_index} = require("../lib/tests")
const {initTests} = require("../lib/init-tests")

jest.mock("aws-xray-sdk")

AWSXray.captureAsyncFunc.mockImplementation((_, fn) =>
  fn({addMetadata: jest.fn(), close: jest.fn()})
)

describe("WHEN we invoke GET / endpoint", () => {
  beforeAll(async () => await initTests())
  it("SHOULD return the index page with 8 restaurants", async () => {
    const res = await invoke_get_index()

    expect(res.statusCode).toEqual(200)
    expect(res.headers["content-type"]).toEqual("text/html; charset=UTF-8")

    const $ = cheerio.load(res.body)
    const restaurants = $(".restaurant", "#restaurantsUl")

    expect(restaurants.length).toEqual(8)
  })
})
