const {initTests} = require("../lib/init-tests")
const {invoke_get_restaurants} = require("../lib/tests")

describe(`When we invoke the GET /restaurants endpoint`, () => {
  beforeAll(async () => {
    await initTests()
  })

  it(`Should return an array of 8 restaurants`, async () => {
    const res = await invoke_get_restaurants()

    expect(res.statusCode).toEqual(200)
    expect(res.body.length).toEqual(8)

    for (let restaurant of res.body) {
      expect(restaurant).toHaveProperty("name")
      expect(restaurant).toHaveProperty("image")
    }
  })
})
