import axios from 'axios'
import _ from 'lodash'
import { CONSTANTS } from './env'
import { logError, logInfo } from './logger'
const API_END_POINTS = {
  assessmentSubmitV2: `${CONSTANTS.SB_EXT_API_BASE_2}/v2/user`,
  updateAssessmentContent: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/course/v1/content/state/update`,
}

export async function assessmentCreator(
  // tslint:disable-next-line: no-any
  assessmentReqData: any,
  // tslint:disable-next-line: no-any
  userToken: any,
  // tslint:disable-next-line: no-any
  userId: any
) {
  const statusMessage = {
    data: {},
    message: 'Assessment submitted successfully',
    status: 200,
  }
  try {
    const batchId = assessmentReqData.batchId
    const courseId = assessmentReqData.courseId
    const assessmentId = assessmentReqData.contentId
    const assessmentQuestions = await fetchAssessment(
      assessmentReqData.artifactUrl
    )
    if (assessmentQuestions) {
      const formatedRequest = getFormatedRequest(
        assessmentQuestions,
        assessmentReqData
      )
      const url = `${API_END_POINTS.assessmentSubmitV2}/assessment/submit`
      const response = await axios({
        data: formatedRequest,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg: 'aastar',
          userId,
          'x-authenticated-user-token': userToken,
        },
        method: 'POST',
        url,
      })
      logInfo('Submit assessment response', response.data)
      const revisedData = {
        request: {
          contents: [
            {
              batchId,
              completionPercentage: 100,
              contentId: assessmentId,
              courseId,
              status: 2,
            },
          ],
          userId,
        },
      }
      const assessmentZeroCases = [
        'do_113474390542598144143',
        'do_113474390542598144144',
        'do_1135849304134778881218',
        'do_11357406890855628811485',
        'do_11357407983906816011501',
        'do_11363374472452505611136',
        'do_1135849304134778881218',
        'do_1136196375912202241920',
        'do_1136196375912202241920',
        'do_11363162331070464011096',
        'do_11363237170624102411122',
        'do_1136131879061176321784',
        'do_11364359967729254411225',
        'do_11364361767574732811236',
        'do_11364354964428390411199',
        'do_11364352865782169611191',
        'do_11364358297626214411209',
        'do_11364849088283443211275',
        'do_11364359355564851211217',
        'do_11364850667644518411277',
        'do_1135835104849838081189',
        'do_11357630305401241611605',
        'do_11357423020077056011549',
        'do_11357638775481958411623',
        'do_11357840328540979211643',
        'do_11357843749466112011652',
        'do_11357846999601152011667',
        'do_11357848737662566411678',
        'do_11357849253907660811686',
        'do_113581218511626240112',
        'do_113581269589901312120',
        'do_113581315671564288133',
        'do_1135834780320645121175',
        'do_113581326312898560149',
        'do_113581384324685824164',
        'do_113583331597459456191',
        'do_1135834000562257921104',
        'do_1135834057607168001114',
        'do_1135834376942632961125',
        'do_1137121760903741441359',
        'do_113752574847107072175',
        'do_113752615709573120178',
      ]
      if (assessmentZeroCases.indexOf(assessmentId) > 0) {
        response.data.passPercent = 0
      }
      if (response.data.result >= response.data.passPercent) {
        await axios({
          data: revisedData,
          headers: {
            Authorization: CONSTANTS.SB_API_KEY,
            'x-authenticated-user-token': userToken,
          },
          method: 'PATCH',
          url: API_END_POINTS.updateAssessmentContent,
        })
      }
      statusMessage.data = response.data
      return statusMessage
    }
  } catch (err) {
    statusMessage.status = 404
    statusMessage.message = 'Error occured while submit in cb-ext'
    return statusMessage
  }
}
const fetchAssessment = async (artifactUrl: string) => {
  logInfo('Checking fetchAssessment : ', artifactUrl)
  try {
    const response = await axios({
      method: 'GET',
      url: artifactUrl,
    })
    logInfo('Response Data in JSON :', response.data)
    if (response.data.questions) {
      logInfo('Response questions :', _.get(response, 'data'))
      return _.get(response, 'data')
    }
  } catch (err) {
    logError('fetchAssement  failed')
  }
}
// tslint:disable-next-line: no-any
const getFormatedRequest = (data: any, requestBody: any) => {
  logInfo(
    'Response of questions in in getFormated method JSON :',
    JSON.stringify(data.questions)
  )

  _.forEach(data.questions, (qkey) => {
    _.forEach(requestBody.questions, (reqKey) => {
      if (
        qkey.questionType === 'mcq-sca' ||
        qkey.questionType === 'fitb' ||
        qkey.questionType === 'mcq-mca'
      ) {
        _.forEach(qkey.options, (qoptKey) => {
          _.forEach(reqKey.options, (optKey) => {
            if (optKey.optionId === qoptKey.optionId) {
              if (
                qkey.questionType === 'mcq-sca' ||
                qkey.questionType === 'fitb' ||
                qkey.questionType === 'mcq-mca'
              ) {
                _.set(optKey, 'isCorrect', _.get(qoptKey, 'isCorrect'))
                _.set(optKey, 'text', _.get(qoptKey, 'text'))
              } else if (qkey.questionType === 'mtf') {
                _.set(optKey, 'isCorrect', _.get(qoptKey, 'isCorrect'))
                _.set(optKey, 'match', _.get(qoptKey, 'match'))
              }
            }
          })
        })
      }
    })
  })
  logInfo('requestBody to submit the assessment ', JSON.stringify(requestBody))
  return requestBody
}
