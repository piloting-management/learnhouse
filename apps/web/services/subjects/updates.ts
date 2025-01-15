import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  getResponseMetadata,
} from '@services/utils/ts/requests'

export async function createSubjectUpdate(body: any, access_token: string) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${body.subject_uuid}/updates`,
    RequestBodyWithAuthHeader('POST', body, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function deleteSubjectUpdate(
  subject_uuid: string,
  update_uuid: number,
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${subject_uuid}/update/${update_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}
