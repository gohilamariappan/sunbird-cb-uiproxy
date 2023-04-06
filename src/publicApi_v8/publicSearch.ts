import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
import { Client } from 'pg'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'

export const publicSearch = Router()
const unknownError = 'Failed due to unknown reason'

const API_END_POINTS = {
  search: `${CONSTANTS.HTTPS_HOST}/apis/public/v8/publicContent/v1/search`,
}
const elasticSearchConnectionDetails = {
  database: CONSTANTS.POSTGRES_DATABASE,
  host: CONSTANTS.POSTGRES_HOST,
  password: CONSTANTS.POSTGRES_PASSWORD,
  port: CONSTANTS.POSTGRES_PORT,
  user: CONSTANTS.POSTGRES_USER,
}
const client = new Client({
  database: elasticSearchConnectionDetails.database,
  host: elasticSearchConnectionDetails.host,
  password: elasticSearchConnectionDetails.password,
  port: Number(elasticSearchConnectionDetails.port),
  user: elasticSearchConnectionDetails.user,
})

const headers = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  org: 'aastar',
  rootorg: 'aastar',
}
// tslint:disable-next-line: no-any
const competencySearchController = async (courseSearchRequestData: any) => {
  const requestBodyForCompetencyLevel = JSON.stringify({
    request: {
      filters: {
        competencySearch:
          courseSearchRequestData.request.filters.competencySearch,
        contentType: ['Course'],
        primaryCategory: ['Course'],
        status: ['Live'],
      },
      sort_by: {
        lastUpdatedOn: 'desc',
      },
    },
    sort: [
      {
        lastUpdatedOn: 'desc',
      },
    ],
  })
  return axios({
    data: requestBodyForCompetencyLevel,
    headers,
    method: 'post',
    url: API_END_POINTS.search,
  })
}
// tslint:disable-next-line: no-any
const homePageCourseController = async () => {
  const requestBodyHomePageCourseData = JSON.stringify({
    query: '',
    request: {
      filters: {
        contentType: ['Course'],
        primaryCategory: ['Course'],
        status: ['Live'],
      },
      sort_by: {
        lastUpdatedOn: 'desc',
      },
    },
    sort: [
      {
        lastUpdatedOn: 'desc',
      },
    ],
  })
  return axios({
    data: requestBodyHomePageCourseData,
    headers,
    method: 'post',
    url: API_END_POINTS.search,
  })
}
// tslint:disable-next-line: no-any
const selfAssessmentController = async (courseSearchRequestData: any) => {
  const requestBodyForCompetencySelfAssessment = JSON.stringify({
    request: {
      filters: {
        competency: [true],
        contentType: ['Course'],
        lang: courseSearchRequestData.request.filters.lang,
        primaryCategory: ['Course'],
        status: ['Live'],
      },
    },
    sort: [
      {
        lastUpdatedOn: 'desc',
      },
    ],
  })
  return axios({
    data: requestBodyForCompetencySelfAssessment,
    headers,
    method: 'post',
    url: API_END_POINTS.search,
  })
}
publicSearch.post('/getCourses', async (request, response) => {
  try {
    const courseSearchRequestData = request.body
    logInfo(courseSearchRequestData, 'Request data')
    // .................................For competency search levels..................................
    if (courseSearchRequestData.request.filters.competencySearch) {
      const competencySearchControllerData = await competencySearchController(
        courseSearchRequestData
      )
      if (competencySearchControllerData.data.result.count == 0) {
        response.status(200).json({
          responseCode: 'OK',
          result: {
            content: [],
            count: 0,
          },
          status: 200,
        })
        return
      }
      const responseForCompetencyLevel =
        competencySearchControllerData.data.result.content

      response.status(200).json({
        responseCode: 'OK',
        result: {
          content: responseForCompetencyLevel,
          count: responseForCompetencyLevel.length,
        },
        status: 200,
      })
      return
    }
    // ................................For home page courses........................................
    if (
      !courseSearchRequestData.request.filters.competency &&
      !courseSearchRequestData.request.filters.competencySearch &&
      !courseSearchRequestData.request.query
    ) {
      const homePageCourseControllerData = await homePageCourseController()
      const responseForHomePageCourseData =
        homePageCourseControllerData.data.result.content
      response.status(200).json({
        responseCode: 'OK',
        result: {
          content: responseForHomePageCourseData,
          count: responseForHomePageCourseData.length,
        },
        status: 200,
      })
      return
    }
    // ............................. For Self assessment courses.............................
    if (courseSearchRequestData.request.filters.competency) {
      const selfAssessmentCourseControllerData = await selfAssessmentController(
        courseSearchRequestData
      )
      const responseForCompetencySelfAssessmentController =
        selfAssessmentCourseControllerData.data.result.content
      response.status(200).json({
        responseCode: 'OK',
        result: {
          content: responseForCompetencySelfAssessmentController,
          count: responseForCompetencySelfAssessmentController.length,
        },
        status: 200,
      })
      return
    }
    // .................................For search button with query on home page..............................
    if (courseSearchRequestData.request.query) {
      const courseSearchPrimaryData = JSON.stringify({
        request: {
          facets: [
            'learningMode',
            'duration',
            'complexityLevel',
            'catalogPaths',
            'sourceShortName',
            'region',
            'concepts',
            'lastUpdatedOn',
          ],
          fields: [],
          filters: {
            contentType: ['Course'],
            status: ['Live'],
          },
          query: `${courseSearchRequestData.request.query}`,
          sort_by: {
            lastUpdatedOn: '',
          },
        },
      })
      const esResponsePrimaryCourses = await axios({
        data: courseSearchPrimaryData,
        headers,
        method: 'post',
        url: API_END_POINTS.search,
      })
      let courseDataPrimary = esResponsePrimaryCourses.data.result.content
      const facetsData = esResponsePrimaryCourses.data.result.facets
      try {
        client.connect()
        let finalConcatenatedData = []
        client.query(
          `SELECT id FROM public.data_node where type='Competency' and name ILIKE  '%${courseSearchRequestData.request.query}%'`,
          // tslint:disable-next-line: no-any
          async (err: any, res: any) => {
            logInfo(err)
            // tslint:disable-next-line: no-any
            const postgresResponseData = res.rows.map((val: any) => val.id)
            let courseDataSecondary = []
            if (postgresResponseData.length > 0) {
              const elasticSearchData = []
              for (const postgresResponse of postgresResponseData) {
                for (const value of [1, 2, 3, 4, 5]) {
                  elasticSearchData.push(`${postgresResponse}-${value}`)
                }
              }

              const courseSearchSecondaryData = {
                request: {
                  filters: {
                    competencySearch: elasticSearchData,
                    contentType: ['Course'],
                    primaryCategory: ['Course'],
                    status: ['Live'],
                  },
                  sort_by: { lastUpdatedOn: 'desc' },
                },
                sort: [{ lastUpdatedOn: 'desc' }],
              }
              const elasticSearchResponseSecond = await axios({
                data: courseSearchSecondaryData,
                headers,
                method: 'post',
                url: API_END_POINTS.search,
              })

              courseDataSecondary =
                elasticSearchResponseSecond.data.result.content
            }
            if (!courseDataPrimary) {
              courseDataPrimary = []
            }
            const finalFilteredData = []
            finalConcatenatedData =
              courseDataPrimary.concat(courseDataSecondary)
            finalConcatenatedData.forEach((element) => {
              if (!element.competency) {
                finalFilteredData.push(element)
              }
            })
            const uniqueCourseData = _.uniqBy(finalFilteredData, 'identifier')
            if (finalConcatenatedData.length == 0) {
              response.status(200).json({
                responseCode: 'OK',
                result: {
                  content: [],
                  count: 0,
                  facets: [],
                },
                status: 200,
              })
              return
            }
            response.status(200).json({
              responseCode: 'OK',
              result: {
                content: uniqueCourseData,
                count: uniqueCourseData.length,
                facets: facetsData,
              },
              status: 200,
            })
          }
        )
      } catch (error) {
        response.status(400).json({
          message: 'Error while connecting postgres',
        })
      }
    }
  } catch (err) {
    response.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknownError,
      }
    )
  }
})
