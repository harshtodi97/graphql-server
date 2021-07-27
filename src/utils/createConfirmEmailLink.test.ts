import * as Redis from 'ioredis'
import fetch from 'node-fetch'

import { User } from "../entity/User";
import { createConfirmEmailLink } from "./createConfirmEmailLink"
import { createTypeormConn } from "./createTypeormConn"

let userId = "";

beforeAll(async () => {
  await createTypeormConn();
  const user = await User.create({
    email: "bob5@bob.com",
    password: "sdfsdfsd",
  }).save();
  userId = user.id;
})

test("Make sure createConfirmEmailLink works", async () => {
    const redis = new Redis()
    const url = await createConfirmEmailLink(
    process.env.TEST_HOST as string,
    userId,
    redis
  )

  const response = await fetch(url)
  const text = await response.text()
  expect(text).toEqual("ok")
  const user = await User.findOne({ where: { id: userId } })
  expect((user as User).confirmed).toBeTruthy();
  const chunks = url.split("/");
  const key = chunks[chunks.length - 1];
  const value = await redis.get(key);
  expect(value).toBeNull();
  console.log(value)
})