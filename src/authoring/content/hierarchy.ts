import axios from 'axios'
import { Request } from 'express'
import { logInfo } from '../../utils/logger'
import { DEFAULT_META } from '../constants/default-meta'
import { getHeaders } from '../utils/header'
import { setOrgRootOrgAsQuery } from '../utils/org-rootOrg-query'
import { IContent } from './../../models/content.model'
import { CONSTANTS } from './../../utils/env'

const hierarchyApi = {
  multiple: (org: string, rootOrg: string) =>
    setOrgRootOrgAsQuery(
      `${CONSTANTS.AUTHORING_BACKEND}/action/content/multiple/hierarchy`,
      org,
      rootOrg
    ),
  v1: (id: string, org: string, rootOrg: string) =>
    setOrgRootOrgAsQuery(
      `${CONSTANTS.AUTHORING_BACKEND}/action/content/hierarchy/${id}`,
      org,
      rootOrg
    ),
  v2: (id: string, org: string, rootOrg: string) =>
    setOrgRootOrgAsQuery(
      `${CONSTANTS.AUTHORING_BACKEND}/action/content/v2/hierarchy/${id}`,
      org,
      rootOrg
    ),
}

export async function getHierarchy(
  id: string,
  org: string,
  rootOrg: string,
  req: Request
): Promise<IContent> {
  const data = await axios.get(hierarchyApi.v1(id, org, rootOrg), getHeaders(req))
  logInfo('1. Checking logs of Hierarchy Api : '+ data)
  logInfo('2. ' + id + ' = Org: ' + org + ' = Root ORG :' + rootOrg)
  return data.data as IContent
}

export async function getHierarchyV2(
  id: string,
  org: string,
  rootOrg: string,
  req: Request
): Promise<IContent> {
  const data = await axios.post(
    hierarchyApi.v2(id, org, rootOrg),
    { fields: DEFAULT_META },
    getHeaders(req)
  )
  return data.data as IContent
}

export async function getMultipleHierarchyV2(
  identifier: string[],
  org: string,
  rootOrg: string,
  req: Request
): Promise<IContent[]> {
  const data = await axios.post(
    hierarchyApi.multiple(org, rootOrg),
    { identifier, fields: DEFAULT_META },
    getHeaders(req)
  )
  return data.data as IContent[]
}
