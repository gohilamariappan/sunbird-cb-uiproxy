import axios from 'axios'
import _ from 'lodash'
import { CONSTANTS } from './env'
import { logInfo } from './logger'
const S3_BUCKET_URL = `${CONSTANTS.S3_BUCKET_URL}`

export async function jumbler(path: string) {
  const sunbirdUrl = S3_BUCKET_URL + path
  return axios({
    method: 'get',
    url: sunbirdUrl,
  }).then((response) => {
    const randomCount =
      response.data.randomCount || response.data.questions.length
    logInfo('Success IN Getting Assessment JSON >>>>>>>>>>>' + response)
    const questionArray = _.sampleSize(response.data.questions, randomCount)
      .map(falseCreator)
      .map(indexEraser)
    const questionObject = {
      isAssessment: true,
      questions: questionArray,
      randomCount: '20',
      timeLimit: response.data.timeLimit,
    }
    logInfo('Question format....' + questionObject)
    i = 0
    return questionObject
  })
}
let i = 1
// tslint:disable-next-line: no-any
const falseCreator = (nums: any) => {
  for (const value of nums.options) {
    value.isCorrect = false
  }
  return nums
}
// tslint:disable-next-line: no-any
const indexEraser = (value: any) => {
  value.question =
    i +
    '.' +
    value.question.slice(
      value.question.indexOf(';') + 1,
      value.question.length
    )
  i++
  return value
}
