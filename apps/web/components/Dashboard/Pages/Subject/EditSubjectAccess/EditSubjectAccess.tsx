import {
  useSubject,
  useSubjectDispatch,
} from '@components/Contexts/SubjectContext'
import LinkToUserGroup from '@components/Objects/Modals/Dash/EditSubjectAccess/LinkToUserGroup'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { getAPIUrl } from '@services/config/config'
import { unLinkResourcesToUserGroup } from '@services/usergroups/usergroups'
import { swrFetcher } from '@services/utils/ts/requests'
import { Globe, SquareUserRound, Users, X } from 'lucide-react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'

type EditSubjectAccessProps = {
  orgslug: string
  subject_uuid?: string
}

function EditSubjectAccess(props: EditSubjectAccessProps) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const subject = useSubject() as any
  const { isLoading, subjectStructure } = subject as any
  const dispatchSubject = useSubjectDispatch() as any

  const { data: usergroups } = useSWR(
    subjectStructure
      ? `${getAPIUrl()}usergroups/resource/${subjectStructure.subject_uuid}`
      : null,
    (url) => swrFetcher(url, access_token)
  )
  const [isClientPublic, setIsClientPublic] = useState<boolean | undefined>(
    undefined
  )

  useEffect(() => {
    if (!isLoading && subjectStructure?.public !== undefined) {
      setIsClientPublic(subjectStructure.public)
    }
  }, [isLoading, subjectStructure])

  useEffect(() => {
    if (
      !isLoading &&
      subjectStructure?.public !== undefined &&
      isClientPublic !== undefined
    ) {
      if (isClientPublic !== subjectStructure.public) {
        dispatchSubject({ type: 'setIsNotSaved' })
        const updatedSubject = {
          ...subjectStructure,
          public: isClientPublic,
        }
        dispatchSubject({
          type: 'setSubjectStructure',
          payload: updatedSubject,
        })
      }
    }
  }, [isLoading, isClientPublic, subjectStructure, dispatchSubject])

  return (
    <div>
      {subjectStructure && (
        <div>
          <div className="h-6"></div>
          <div className="mx-4 sm:mx-10 bg-white rounded-xl shadow-sm px-4 py-4">
            <div className="flex flex-col bg-gray-50 -space-y-1 px-3 sm:px-5 py-3 rounded-md mb-3">
              <h1 className="font-bold text-lg sm:text-xl text-gray-800">
                Access to the subject
              </h1>
              <h2 className="text-gray-500 text-xs sm:text-sm">
                Choose if you want your subject to be publicly available on the
                internet or only accessible to signed in users
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mx-auto mb-3">
              <ConfirmationModal
                confirmationButtonText="Change to Public"
                confirmationMessage="Are you sure you want this subject to be publicly available on the internet?"
                dialogTitle="Change to Public?"
                dialogTrigger={
                  <div className="w-full h-[200px] bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                    {isClientPublic && (
                      <div className="bg-green-200 text-green-600 font-bold w-fit my-3 mx-3 absolute text-sm px-3 py-1 rounded-lg">
                        Active
                      </div>
                    )}
                    <div className="flex flex-col space-y-1 justify-center items-center h-full p-2 sm:p-4">
                      <Globe className="text-slate-400" size={32} />
                      <div className="text-xl sm:text-2xl text-slate-700 font-bold">
                        Public
                      </div>
                      <div className="text-gray-400 text-sm sm:text-md tracking-tight w-full sm:w-[500px] leading-5 text-center">
                        The Subject is publicly available on the internet, it is
                        indexed by search engines and can be accessed by anyone
                      </div>
                    </div>
                  </div>
                }
                functionToExecute={() => setIsClientPublic(true)}
                status="info"
              />
              <ConfirmationModal
                confirmationButtonText="Change to Users Only"
                confirmationMessage="Are you sure you want this subject to be only accessible to signed in users?"
                dialogTitle="Change to Users Only?"
                dialogTrigger={
                  <div className="w-full h-[200px] bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                    {!isClientPublic && (
                      <div className="bg-green-200 text-green-600 font-bold w-fit my-3 mx-3 absolute text-sm px-3 py-1 rounded-lg">
                        Active
                      </div>
                    )}
                    <div className="flex flex-col space-y-1 justify-center items-center h-full p-2 sm:p-4">
                      <Users className="text-slate-400" size={32} />
                      <div className="text-xl sm:text-2xl text-slate-700 font-bold">
                        Users Only
                      </div>
                      <div className="text-gray-400 text-sm sm:text-md tracking-tight w-full sm:w-[500px] leading-5 text-center">
                        The Subject is only accessible to signed in users,
                        additionally you can choose which UserGroups can access
                        this subject
                      </div>
                    </div>
                  </div>
                }
                functionToExecute={() => setIsClientPublic(false)}
                status="info"
              />
            </div>
            {!isClientPublic && <UserGroupsSection usergroups={usergroups} />}
          </div>
        </div>
      )}
    </div>
  )
}

function UserGroupsSection({ usergroups }: { usergroups: any[] }) {
  const subject = useSubject() as any
  const [userGroupModal, setUserGroupModal] = useState(false)
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const removeUserGroupLink = async (usergroup_id: number) => {
    try {
      const res = await unLinkResourcesToUserGroup(
        usergroup_id,
        subject.subjectStructure.subject_uuid,
        access_token
      )
      if (res.status === 200) {
        toast.success('Successfully unlinked from usergroup')
        mutate(
          `${getAPIUrl()}usergroups/resource/${subject.subjectStructure.subject_uuid}`
        )
      } else {
        toast.error(`Error ${res.status}: ${res.data.detail}`)
      }
    } catch (error) {
      toast.error('An error occurred while unlinking the user group.')
    }
  }

  return (
    <>
      <div className="flex flex-col bg-gray-50 -space-y-1 px-3 sm:px-5 py-3 rounded-md mb-3">
        <h1 className="font-bold text-lg sm:text-xl text-gray-800">
          UserGroups
        </h1>
        <h2 className="text-gray-500 text-xs sm:text-sm">
          You can choose to give access to this subject to specific groups of
          users only by linking it to a UserGroup
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left whitespace-nowrap rounded-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-500 rounded-xl uppercase">
            <tr className="font-bolder text-sm">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="mt-5 bg-white rounded-md">
            {usergroups?.map((usergroup: any) => (
              <tr
                key={usergroup.invite_code_uuid}
                className="border-b border-gray-100 text-sm"
              >
                <td className="py-3 px-4">{usergroup.name}</td>
                <td className="py-3 px-4">
                  <ConfirmationModal
                    confirmationButtonText="Delete Link"
                    confirmationMessage="Users from this UserGroup will no longer have access to this subject"
                    dialogTitle="Unlink UserGroup?"
                    dialogTrigger={
                      <button className="mr-2 flex space-x-2 hover:cursor-pointer p-1 px-3 bg-rose-700 rounded-md font-bold items-center text-sm text-rose-100">
                        <X className="w-4 h-4" />
                        <span>Delete link</span>
                      </button>
                    }
                    functionToExecute={() => removeUserGroupLink(usergroup.id)}
                    status="warning"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-row-reverse mt-3 mr-2">
        <Modal
          isDialogOpen={userGroupModal}
          onOpenChange={() => setUserGroupModal(!userGroupModal)}
          minHeight="no-min"
          minWidth="md"
          dialogContent={
            <LinkToUserGroup setUserGroupModal={setUserGroupModal} />
          }
          dialogTitle="Link Subject to a UserGroup"
          dialogDescription="Choose a UserGroup to link this subject to. Users from this UserGroup will have access to this subject."
          dialogTrigger={
            <button className="flex space-x-2 hover:cursor-pointer p-1 px-3 bg-green-700 rounded-md font-bold items-center text-xs sm:text-sm text-green-100">
              <SquareUserRound className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Link to a UserGroup</span>
            </button>
          }
        />
      </div>
    </>
  )
}

export default EditSubjectAccess
