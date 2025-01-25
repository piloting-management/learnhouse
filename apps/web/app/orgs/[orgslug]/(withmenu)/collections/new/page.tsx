'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { createCollection } from '@services/subjects/collections'
import useSWR from 'swr'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { revalidateTags, swrFetcher } from '@services/utils/ts/requests'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'

function NewCollection(params: any) {
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const orgslug = params.params.orgslug
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selectedSubjects, setSelectedSubjects] = React.useState([]) as any
  const router = useRouter()
  const { data: subjects, error: error } = useSWR(
    `${getAPIUrl()}subjects/org_slug/${orgslug}/page/1/limit/10`,
    (url) => swrFetcher(url, access_token)
  )
  const [isPublic, setIsPublic] = useState('true')

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsPublic(e.target.value)
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(event.target.value)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const collection = {
      name: name,
      description: description,
      subjects: selectedSubjects,
      public: isPublic,
      org_id: org.id,
    }
    await createCollection(collection, session.data?.tokens?.access_token)
    await revalidateTags(['collections'], org.slug)
    // reload the page
    router.refresh()

    // wait for 2s before reloading the page
    setTimeout(() => {
      router.push(getUriWithOrg(orgslug, '/collections'))
    }, 1000)
  }

  return (
    <>
      <div className="w-64 m-auto py-20">
        <div className="font-bold text-lg mb-4">Add new</div>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={handleNameChange}
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          onChange={handleVisibilityChange}
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue={isPublic}
        >
          <option value="false">Private Collection</option>
          <option value="true">Public Collection </option>
        </select>

        {!subjects ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4 p-3">
            <p>Subjects</p>
            {subjects.map((subject: any) => (
              <div
                key={subject.subject_uuid}
                className="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  id={subject.id}
                  name={subject.name}
                  value={subject.id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubjects([...selectedSubjects, subject.id])
                    } else {
                      setSelectedSubjects(
                        selectedSubjects.filter(
                          (subject_uuid: any) =>
                            subject_uuid !== subject.subject_uuid
                        )
                      )
                    }
                  }}
                  className="text-blue-500 rounded  focus:ring-2 focus:ring-blue-500"
                />

                <label
                  htmlFor={subject.subject_uuid}
                  className="text-sm text-gray-700"
                >
                  {subject.name}
                </label>
              </div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={handleDescriptionChange}
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSubmit}
          className="px-6 py-3 text-white bg-black rounded-lg shadow-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </div>
    </>
  )
}

export default NewCollection
