import { OrderPayload } from '@components/Dashboard/Pages/Subject/EditSubjectStructure/EditSubjectStructure'
import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

/*
 This file includes only POST, PUT, DELETE requests
 GET requests are called from the frontend using SWR (https://swr.vercel.app/)
*/

//TODO : depreciate this function
export async function getSubjectChaptersMetadata(
  subject_uuid: any,
  next: any,
  access_token: any
) {
  const result = await fetch(
    `${getAPIUrl()}chapters/meta/subject_${subject_uuid}`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateChaptersMetadata(
  subject_uuid: any,
  data: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}chapters/subject/subject_${subject_uuid}/order`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateChapter(
  subjectchapter_id: any,
  data: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}chapters/${subjectchapter_id}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateSubjectOrderStructure(
  subject_uuid: any,
  data: OrderPayload,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}chapters/subject/${subject_uuid}/order`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function createChapter(data: any, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}chapters/`,
    RequestBodyWithAuthHeader('POST', data, null, access_token)
  )
  const res = await errorHandling(result)

  return res
}

export async function deleteChapter(subjectchapter_id: any, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}chapters/${subjectchapter_id}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}
