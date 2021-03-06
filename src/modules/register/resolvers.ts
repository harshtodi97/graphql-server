import * as bcrypt from 'bcryptjs'
import * as yup from "yup"

import { User } from '../../entity/User'
import { ResolverMap } from '../../types/graphql-utils'
import { createConfirmEmailLink } from '../../utils/createConfirmEmailLink'
import { formatYupError } from '../../utils/formatYupError'
import { duplicateEmail, emailNotLongEnough, invalidEmail, passwordNotLongEnough } from './errorMessages'

const schema = yup.object().shape({
  email: yup.string().min(3, emailNotLongEnough).max(255).email(invalidEmail),
  password: yup.string().min(3, passwordNotLongEnough).max(255),
})

export const resolvers: ResolverMap = {
  Mutation: {
    register: async (_, args: GQL.IRegisterOnMutationArguments, { redis, url }) => {
      try {
        await schema.validate(args, { abortEarly: false })
      } catch (err) {
        return formatYupError(err)
      }

      const { email, password } = args;
      const userAlreadyExits = await User.findOne({
        where: { email },
        select: ["id"]
      })

      if (userAlreadyExits) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ]
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = User.create({
        email,
        password: hashedPassword
      })

      await user.save()

      await createConfirmEmailLink(url, user.id, redis)

      return null
    }
  }
}