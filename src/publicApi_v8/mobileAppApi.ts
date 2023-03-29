import { Router } from "express";
import jwt_decode from "jwt-decode";
import request from "request";
import { assessmentCreator } from "../utils/assessmentSubmitHelper";
import { CONSTANTS } from "../utils/env";
import { logInfo } from "../utils/logger";
import { getCurrentUserRoles } from "./rolePermission";

export const mobileAppApi = Router();

mobileAppApi.get("/getContents/*", (req, res) => {
  try {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      res.status(404).json({
        message: "User token missing",
      });
      return;
    }
    let userId = "";
    try {
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken.toString());
      const decodedTokenArray = decodedToken.sub.split(":");
      userId = decodedTokenArray[decodedTokenArray.length - 1];
    } catch (error) {
      res.status(404).json({
        message: "Invalid user token",
      });
      return;
    }
    logInfo("UserId for new APP api getContents", userId);
    const path = removePrefix(
      "/public/v8/mobileApp/getContents/",
      req.originalUrl
    );
    const sunbirdUrl = CONSTANTS.S3_BUCKET_URL + path;
    logInfo(
      "New getcontents sunbird URL for Mobile APP >>>>>>>>>>> ",
      sunbirdUrl
    );
    return request(sunbirdUrl).pipe(res);
  } catch (err) {
    res.status(404).json({
      message: "Content not found",
    });
  }
});

mobileAppApi.post("/submitAssessment", async (req, res) => {
  try {
    const assessmentData = req.body;
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      res.status(404).json({
        message: "User token missing",
      });
      return;
    }
    let userId = "";
    try {
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken.toString());
      const decodedTokenArray = decodedToken.sub.split(":");
      userId = decodedTokenArray[decodedTokenArray.length - 1];
    } catch (error) {
      res.status(404).json({
        message: "Invalid user token",
      });
      return;
    }
    const assessmentSubmitStatus = await assessmentCreator(
      assessmentData,
      accessToken,
      userId
    );
    res.status(assessmentSubmitStatus.status).json(assessmentSubmitStatus.data);
  } catch (err) {
    res.status(404).json({
      message: "Error occured while submit",
    });
  }
});
mobileAppApi.get("/webviewLogin", async (req: any, res) => {
  const AUTH_FAIL =
    "Authentication failed ! Please check credentials and try again.";
  const userToken = req.headers.authorization;
  if (userToken) {
    // tslint:disable-next-line: no-any
    const decodedToken: any = jwt_decode(userToken);
    const decodedTokenArray = decodedToken.sub.split(":");
    const userId = decodedTokenArray[decodedTokenArray.length - 1];
    req.session.userId = userId;
    logInfo(userId, "userid......................");
    req.kauth = {
      grant: {
        access_token: { content: decodedToken, token: userToken },
      },
    };
    req.session.grant = {
      access_token: { content: decodedToken, token: userToken },
    };
    logInfo("Success ! Entered into usertokenResponse..");
    await getCurrentUserRoles(req, userToken);
  } else {
    res.status(302).json({
      msg: AUTH_FAIL,
      status: "error",
    });
  }
  res.status(200).json({
    message: "success",
  });
});
function removePrefix(prefix: string, s: string) {
  return s.substr(prefix.length);
}
