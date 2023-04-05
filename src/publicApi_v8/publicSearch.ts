import axios from "axios";
import { Router } from "express";
import { Client } from "pg";
import { CONSTANTS } from "../utils/env";
import { logInfo } from "../utils/logger";

export const publicSearch = Router();
const unknownError = "Failed due to unknown reason";

const API_END_POINTS = {
  search: `${CONSTANTS.HTTPS_HOST}/apis/public/v8/publicContent/v1/search`,
};
const elasticSearchConnectionDetails = {
  database: CONSTANTS.POSTGRES_DATABASE,
  host: CONSTANTS.POSTGRES_HOST,
  password: CONSTANTS.POSTGRES_PASSWORD,
  port: CONSTANTS.POSTGRES_PORT,
  user: CONSTANTS.POSTGRES_USER,
};

publicSearch.post("/getCourses", async (request, response) => {
  try {
    const client = new Client({
      database: elasticSearchConnectionDetails.database,
      host: elasticSearchConnectionDetails.host,
      password: elasticSearchConnectionDetails.password,
      port: Number(elasticSearchConnectionDetails.port),
      user: elasticSearchConnectionDetails.user,
    });
    const courseSearchRequestData = request.body.data.value;
    logInfo(courseSearchRequestData, "Request data");
    const courseSearchPrimaryData = JSON.stringify({
      request: {
        facets: [
          "learningMode",
          "duration",
          "complexityLevel",
          "catalogPaths",
          "sourceShortName",
          "region",
          "concepts",
          "lastUpdatedOn",
        ],
        fields: [],
        filters: {
          contentType: ["Course"],
          status: ["Live"],
        },
        query: `${courseSearchRequestData}`,
        sort_by: {
          lastUpdatedOn: "",
        },
      },
    });
    const esResponsePrimaryCourses = await axios({
      data: courseSearchPrimaryData,
      headers: {
        // tslint:disable-next-line:max-line-length
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        org: "aastar",
        rootorg: "aastar",
      },
      method: "post",
      url: API_END_POINTS.search,
    });
    const courseDataPrimary = esResponsePrimaryCourses.data.result.content;
    const facetsData = esResponsePrimaryCourses.data.result.facets;
    logInfo("Coursedata for primary courses length", courseDataPrimary.length);

    try {
      client.connect();
      let finalConcatenatedData = [];
      client.query(
        `SELECT id FROM public.data_node where type='Competency' and name LIKE  '%${courseSearchRequestData}%'`,
        // tslint:disable-next-line: no-any
        async (err: any, res: any) => {
          logInfo(err);
          // tslint:disable-next-line: no-any
          const postgresResponseData = res.rows.map((val: any) => val.id);
          let courseDataSecondary = [];
          if (postgresResponseData.length > 0) {
            const elasticSearchData = [];
            for (const postgresResponse of postgresResponseData) {
              for (const value of [1, 2, 3, 4, 5]) {
                elasticSearchData.push(`${postgresResponse}-${value}`);
              }
            }

            const courseSearchSecondaryData = {
              request: {
                filters: {
                  competencySearch: elasticSearchData,
                  contentType: ["Course"],
                  primaryCategory: ["Course"],
                  status: ["Live"],
                },
                sort_by: { lastUpdatedOn: "desc" },
              },
              sort: [{ lastUpdatedOn: "desc" }],
            };
            const elasticSearchResponseSecond = await axios({
              data: courseSearchSecondaryData,
              headers: {
                // tslint:disable-next-line:max-line-length
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
                org: "aastar",
                rootorg: "aastar",
              },
              method: "post",
              url: API_END_POINTS.search,
            });
            client.end();
            courseDataSecondary =
              elasticSearchResponseSecond.data.result.content;

            logInfo(
              "Coursedata for secondary courses length",
              JSON.stringify(courseDataSecondary.length)
            );
          }
          finalConcatenatedData = courseDataPrimary.concat(courseDataSecondary);
          response.status(200).json({
            result: {
              content: finalConcatenatedData,
              factes: facetsData,
            },
          });
        }
      );
    } catch (error) {
      response.status(400).json({
        message: "Error while connecting postgres",
      });
    }
  } catch (err) {
    response.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknownError,
      }
    );
  }
});
