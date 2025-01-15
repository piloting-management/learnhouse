import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyFormWithAuthHeader,
  RequestBodyWithAuthHeader,
  errorHandling,
  getResponseMetadata,
} from '@services/utils/ts/requests'

/*
 This file includes only POST, PUT, DELETE requests
 GET requests are called from the frontend using SWR (https://swr.vercel.app/)
*/

export async function getOrgSubjects(
  org_slug: string,
  next: any,
  access_token?: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/org_slug/${org_slug}/page/1/limit/10`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function getSubjectMetadata(
  subject_uuid: any,
  next: any,
  access_token: string
) {
  const result = await fetch(
    `${getAPIUrl()}subjects/subject_${subject_uuid}/meta`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateSubject(
  subject_uuid: any,
  data: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${subject_uuid}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function getSubject(
  subject_uuid: string,
  next: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${subject_uuid}`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function getSubjectById(
  subject_id: string,
  next: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/id/${subject_id}`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateSubjectThumbnail(
  subject_uuid: any,
  thumbnail: any,
  access_token: any
) {
  const formData = new FormData()
  formData.append('thumbnail', thumbnail)
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${subject_uuid}/thumbnail`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function createNewSubject(
  org_id: string,
  subject_body: any,
  thumbnail: any,
  access_token: any
) {
  // Send file thumbnail as form data
  const formData = new FormData()
  formData.append('name', subject_body.name)
  formData.append('description', subject_body.description)
  formData.append('public', subject_body.visibility)
  formData.append('learnings', subject_body.tags)
  formData.append('tags', subject_body.tags)
  formData.append('about', subject_body.description)

  if (thumbnail) {
    formData.append('thumbnail', thumbnail)
  }

  const result = await fetch(
    `${getAPIUrl()}subjects/?org_id=${org_id}`,
    RequestBodyFormWithAuthHeader('POST', formData, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function deleteSubjectFromBackend(
  subject_uuid: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}subjects/${subject_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}
