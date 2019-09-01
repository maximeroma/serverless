const {initTests} = require("../lib/init-tests")
const {invoke_search_restaurants} = require("../lib/tests")
const given = require("../lib/given")
const tearDown = require("../lib/tear-down")

describe("Given an authenticated user", () => {
  let user
  beforeAll(async () => {
    await initTests()
    user = await given.an_authenticated_user()
  })

  afterAll(async () => {
    await tearDown.an_authenticated_user()
  })

  describe(`When we invoke the POST /restaurants/search endpoint with theme 'cartoon'`, () => {
    it(`Should return an array of 4 restaurants`, async () => {
      console.log(user)
      let res = await invoke_search_restaurants(user, "cartoon")

      expect(res.statusCode).toEqual(200)
      expect(res.body.length).toEqual(4)

      for (let restaurant of res.body) {
        expect(restaurant).toHaveProperty("name")
        expect(restaurant).toHaveProperty("image")
      }
    })
  })
})
