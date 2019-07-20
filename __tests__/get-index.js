const cheerio = require("cheerio")
const {invoke_get_index} = require("../lib/tests")
const {initTests} = require("../lib/init-tests")

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
