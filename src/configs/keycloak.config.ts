import { CONSTANTS } from '../utils/env'

export function getKeycloakConfig(realm?: string) {
  return {
    'ssl-required': 'external',
    // tslint:disable-next-line: object-literal-sort-keys
    'public-client': true,
    realm: realm ? realm : CONSTANTS.KEYCLOAK_REALM,
    resource: 'portal',
  }
}
