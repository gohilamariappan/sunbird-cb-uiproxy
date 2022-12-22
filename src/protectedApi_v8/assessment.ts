import axios from "axios";
import { Router } from "express";
import _ from "lodash";
import { axiosRequestConfig } from "../configs/request.config";
import { CONSTANTS } from "../utils/env";
import { logError, logInfo } from "../utils/logger";
import { ERROR } from "../utils/message";
import {
  extractUserIdFromRequest,
  extractUserToken,
} from "../utils/requestExtract";
export const assessmentApi = Router();
const GENERAL_ERR_MSG = "Failed due to unknown reason";
const API_END_POINTS = {
  assessmentSubmitV2: `${CONSTANTS.SB_EXT_API_BASE_2}/v2/user`,
  updateAssessmentContent: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/course/v1/content/state/update`,
};
assessmentApi.post("/submit/v2", async (req, res) => {
  logInfo(">>>>>>>>>>>>inside submit v2");
  try {
    logInfo("Check Submit V2 : ", req.body.artifactUrl);
    if (!req.body.artifactUrl) {
      res.status(400).json({
        msg: "Warning ! Artifact Url can not be empty.",
        status: "error",
        status_code: 400,
      });
    }
    if (!req.body.courseId) {
      res.status(400).json({
        msg: "Warning ! Course Id can not be empty.",
        status: "error",
        status_code: 400,
      });
    }
    if (!req.body.batchId) {
      res.status(400).json({
        msg: "Warning ! Batch Id can not be empty.",
        status: "error",
        status_code: 400,
      });
    }
    const org = req.header("org");
    const rootOrg = req.header("rootOrg");
    if (!org || !rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA);
      return;
    }
    const { artifactUrl } = req.body;
    const assessmentData = await fetchAssessment(artifactUrl);
    if (assessmentData) {
      const formatedRequest = getFormatedRequest(assessmentData, req.body);
      logInfo("formatedRequest", formatedRequest);
      const userId = extractUserIdFromRequest(req);
      const url = `${API_END_POINTS.assessmentSubmitV2}/assessment/submit`;
      // Create new key into session and add metadata
      const accessToken = extractUserToken(req);
      const response = await axios({
        ...axiosRequestConfig,
        data: formatedRequest,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg,
          userId,
          "x-authenticated-user-token": accessToken,
        },
        method: "POST",
        url,
      });
      const revisedData = {
        request: {
          contents: [
            {
              batchId: req.body.batchId,
              completionPercentage: 100,
              contentId: req.body.contentId,
              courseId: req.body.courseId,
              status: 2,
            },
          ],
          userId: req.body.userId ? req.body.userId : userId,
        },
      };
      logInfo("Content has completed the course." + revisedData);
      // exception for pre-assessments
      // tslint:disable-next-line: max-line-length
      const assessmentZeroCases = [
        "do_113474390542598144143",
        "do_113474390542598144144",
        "do_1135849304134778881218",
        "do_11357406890855628811485",
        "do_11357407983906816011501",
        "do_11363374472452505611136",
        "do_1135849304134778881218",
        "do_1136196375912202241920",
        "do_1136196375912202241920",
        "do_11363162331070464011096",
        "do_11363237170624102411122",
        "do_1136131879061176321784",
        "do_11364359967729254411225",
        "do_11364361767574732811236",
        "do_11364354964428390411199",
        "do_11364352865782169611191",
        "do_11364358297626214411209",
        "do_11364849088283443211275",
        "do_11364359355564851211217",
        "do_11364850667644518411277",
        "do_1135835104849838081189",
        "do_11357630305401241611605",
        "do_11357423020077056011549",
        "do_11357638775481958411623",
        "do_11357840328540979211643",
        "do_11357843749466112011652",
        "do_11357846999601152011667",
        "do_11357848737662566411678",
        "do_11357849253907660811686",
        "do_113581218511626240112",
        "do_113581269589901312120",
        "do_113581315671564288133",
        "do_1135834780320645121175",
        "do_113581326312898560149",
        "do_113581384324685824164",
        "do_113583331597459456191",
        "do_1135834000562257921104",
        "do_1135834057607168001114",
        "do_1135834376942632961125",
      ];
      if (assessmentZeroCases.indexOf(req.body.contentId) > 0) {
        response.data.passPercent = 0;
      }
      if (response.data.result >= response.data.passPercent) {
        await axios({
          ...axiosRequestConfig,
          data: revisedData,
          headers: {
            Authorization: CONSTANTS.SB_API_KEY,
            "x-authenticated-user-token": accessToken,
          },
          method: "PATCH",
          url: API_END_POINTS.updateAssessmentContent,
        });
      }

      res.status(response.status).send(response.data);
    }
  } catch (err) {
    logError("submitassessment  failed >>>>>" + err);
    res.status(500).send({
      error: err,
      message: GENERAL_ERR_MSG,
    });
  }
});
assessmentApi.post("/get", async (req, res) => {
  try {
    if (!req.body.artifactUrl) {
      res.status(400).json({
        msg: "artifact Url can not be empty",
        status: "error",
        status_code: 400,
      });
    }
    const { artifactUrl } = req.body;
    const assessmentData = await fetchAssessment(artifactUrl);
    const formatedData = getFormatedResponse(assessmentData);
    res.status(200).json(formatedData);
    logInfo("formatedData Data in JSON :", JSON.stringify(formatedData));
  } catch (err) {
    res.status(401).send({
      error: "error while fetching assesment !!",
    });
  }
});
const fetchAssessment = async (artifactUrl: string) => {
  logInfo("Checking fetchAssessment : ", artifactUrl);
  try {
    const response = await axios({
      ...axiosRequestConfig,
      method: "GET",
      url: artifactUrl,
    });
    logInfo("Response Data in JSON :", response.data);
    if (response.data.questions) {
      logInfo("Response questions :", _.get(response, "data"));
      return _.get(response, "data");
    }
  } catch (err) {
    logError("fetchAssement  failed");
  }
};
// tslint:disable-next-line: no-any
const getFormatedResponse = (data: any) => {
  logInfo(
    "Response of questions in formated method JSON :",
    JSON.stringify(data.questions)
  );
  const assessmentInfo = {
    isAssessment: _.get(data, "isAssessment"),
    questions: [],
    timeLimit: _.get(data, "timeLimit"),
  };

  const formtedAssessmentInfo = _.forEach(data.questions, (qkey) => {
    // eslint-disable-next-line
    if (qkey.questionType === "mcq-sca" || qkey.questionType === "mtf") {
      _.forEach(qkey.options, (optKey) => {
        _.set(optKey, "isCorrect", false);
      });
      // eslint-disable-next-line
    } else if (qkey.questionType === "fitb" && qkey.options.length > 0) {
      _.forEach(qkey.options, (optKey) => {
        _.set(optKey, "isCorrect", false);
        _.set(optKey, "text", "");
      });
    }
  });
  assessmentInfo.questions = formtedAssessmentInfo;
  return assessmentInfo;
};
// eslint-disable-next-line
// tslint:disable-next-line: no-any
const getFormatedRequest = (data: any, requestBody: any) => {
  logInfo(
    "Response of questions in in getFormated method JSON :",
    JSON.stringify(data.questions)
  );

  _.forEach(data.questions, (qkey) => {
    _.forEach(requestBody.questions, (reqKey) => {
      if (
        qkey.questionType === "mcq-sca" ||
        qkey.questionType === "fitb" ||
        qkey.questionType === "mcq-mca"
      ) {
        _.forEach(qkey.options, (qoptKey) => {
          _.forEach(reqKey.options, (optKey) => {
            if (optKey.optionId === qoptKey.optionId) {
              if (
                qkey.questionType === "mcq-sca" ||
                qkey.questionType === "fitb" ||
                qkey.questionType === "mcq-mca"
              ) {
                _.set(optKey, "isCorrect", _.get(qoptKey, "isCorrect"));
                _.set(optKey, "text", _.get(qoptKey, "text"));
              } else if (qkey.questionType === "mtf") {
                _.set(optKey, "isCorrect", _.get(qoptKey, "isCorrect"));
                _.set(optKey, "match", _.get(qoptKey, "match"));
              }
            }
          });
        });
      }
    });
  });
  logInfo("requestBody to submit the assessment ", JSON.stringify(requestBody));
  return requestBody;
};
