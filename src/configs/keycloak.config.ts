import { CONSTANTS } from "../utils/env";
import { logInfo } from "../utils/logger";

export function getKeycloakConfig(url?: string, realm?: string) {
  logInfo("4. Entered into keycloak config " + url);
  return {
    "ssl-required": "external",
    // tslint:disable-next-line: object-literal-sort-keys
    "public-client": true,
    realm: realm ? realm : CONSTANTS.KEYCLOAK_REALM,
    resource: "portal",
  };
}
