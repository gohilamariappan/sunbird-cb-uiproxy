export function generateRandomPassword(length, options) {
  const optionsChars = {
    digits: '1234567890',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    symbols: '@$!%&',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  }
  const chars = []
  for (const key in options) {
    if (
      options.hasOwnProperty(key) &&
      options[key] &&
      optionsChars.hasOwnProperty(key)
    ) {
      chars.push(optionsChars[key])
    }
  }

  if (!chars.length) return ''

  let password = ''
  // tslint:disable-next-line: no-any
  for (const [index] of chars.entries()) {
    password += chars[index].charAt(
      Math.floor(Math.random() * chars[index].length)
    )
  }

  if (length > chars.length) {
    length = length - chars.length
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * chars.length)
      password += chars[index].charAt(
        Math.floor(Math.random() * chars[index].length)
      )
    }
  }

  return password
}
