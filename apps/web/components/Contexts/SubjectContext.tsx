'use client'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import React, { createContext, useContext, useEffect, useReducer } from 'react'
import useSWR from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'

export const SubjectContext = createContext(null)
export const SubjectDispatchContext = createContext(null)

export function SubjectProvider({ children, subjectuuid }: any) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const { data: subjectStructureData, error } = useSWR(
    `${getAPIUrl()}subjects/${subjectuuid}/meta`,
    (url) => swrFetcher(url, access_token)
  )

  const initialState = {
    subjectStructure: {
      subject_uuid: subjectuuid,
    },
    subjectOrder: {},
    isSaved: true,
    isLoading: true,
  }

  const [state, dispatch] = useReducer(subjectReducer, initialState) as any

  useEffect(() => {
    if (subjectStructureData) {
      dispatch({ type: 'setSubjectStructure', payload: subjectStructureData })
      dispatch({ type: 'setIsLoaded' })
    }
  }, [subjectStructureData])

  if (error) return <div>Failed to load subject structure</div>
  if (!subjectStructureData) return ''

  if (subjectStructureData) {
    return (
      <SubjectContext.Provider value={state}>
        <SubjectDispatchContext.Provider value={dispatch}>
          {children}
        </SubjectDispatchContext.Provider>
      </SubjectContext.Provider>
    )
  }
}

export function useSubject() {
  return useContext(SubjectContext)
}

export function useSubjectDispatch() {
  return useContext(SubjectDispatchContext)
}

function subjectReducer(state: any, action: any) {
  switch (action.type) {
    case 'setSubjectStructure':
      return { ...state, subjectStructure: action.payload }
    case 'setSubjectOrder':
      return { ...state, subjectOrder: action.payload }
    case 'setIsSaved':
      return { ...state, isSaved: true }
    case 'setIsNotSaved':
      return { ...state, isSaved: false }
    case 'setIsLoaded':
      return { ...state, isLoading: false }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}
