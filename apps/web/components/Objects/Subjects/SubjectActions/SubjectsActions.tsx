import React, { useState, useEffect } from 'react'
import UserAvatar from '../../UserAvatar'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { removeSubject, startSubject } from '@services/subjects/activity'
import { revalidateTags } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useMediaQuery } from 'usehooks-ts'
import { getUriWithOrg, getUriWithoutOrg } from '@services/config/config'
import { LogIn, LogOut, ShoppingCart, AlertCircle } from 'lucide-react'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import SubjectPaidOptions from './SubjectPaidOptions'
import { checkPaidAccess } from '@services/payments/payments'

interface Author {
  user_uuid: string
  avatar_image: string
  first_name: string
  last_name: string
  username: string
}

interface SubjectRun {
  status: string
  subject_id: string
}

interface Subject {
  id: string
  authors: Author[]
  trail?: {
    runs: SubjectRun[]
  }
}

interface SubjectActionsProps {
  subjectuuid: string
  orgslug: string
  subject: Subject & {
    org_id: number
  }
}

// Separate component for author display
const AuthorInfo = ({
  author,
  isMobile,
}: {
  author: Author
  isMobile: boolean
}) => (
  <div className="flex flex-row md:flex-col mx-auto space-y-0 md:space-y-3 space-x-4 md:space-x-0 px-2 py-2 items-center">
    <UserAvatar
      border="border-8"
      avatar_url={
        author.avatar_image
          ? getUserAvatarMediaDirectory(author.user_uuid, author.avatar_image)
          : ''
      }
      predefined_avatar={author.avatar_image ? undefined : 'empty'}
      width={isMobile ? 60 : 100}
    />
    <div className="md:-space-y-2">
      <div className="text-[12px] text-neutral-400 font-semibold">Author</div>
      <div className="text-lg md:text-xl font-bold text-neutral-800">
        {author.first_name && author.last_name ? (
          <div className="flex space-x-2 items-center">
            <p>{`${author.first_name} ${author.last_name}`}</p>
            <span className="text-xs bg-neutral-100 p-1 px-3 rounded-full text-neutral-400 font-semibold">
              @{author.username}
            </span>
          </div>
        ) : (
          <div className="flex space-x-2 items-center">
            <p>@{author.username}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)

const Actions = ({ subjectuuid, orgslug, subject }: SubjectActionsProps) => {
  const router = useRouter()
  const session = useLHSession() as any
  const [linkedProducts, setLinkedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  const isStarted =
    subject.trail?.runs?.some(
      (run) =>
        run.status === 'STATUS_IN_PROGRESS' && run.subject_id === subject.id
    ) ?? false

  useEffect(() => {
    const fetchLinkedProducts = async () => {
      try {
        // const response = await getProductsBySubject(
        //   subject.org_id,
        //   subject.id,
        //   session.data?.tokens?.access_token
        // )
        // setLinkedProducts(response.data || [])
      } catch (error) {
        console.error('Failed to fetch linked products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLinkedProducts()
  }, [subject.id, subject.org_id, session.data?.tokens?.access_token])

  useEffect(() => {
    const checkAccess = async () => {
      if (!session.data?.user) return
      try {
        const response = await checkPaidAccess(
          parseInt(subject.id),
          subject.org_id,
          session.data?.tokens?.access_token
        )
        setHasAccess(response.has_access)
      } catch (error) {
        console.error('Failed to check subject access')
        setHasAccess(false)
      }
    }

    if (linkedProducts.length > 0) {
      checkAccess()
    }
  }, [
    subject.id,
    subject.org_id,
    session.data?.tokens?.access_token,
    linkedProducts,
  ])

  const handleSubjectAction = async () => {
    if (!session.data?.user) {
      router.push(getUriWithoutOrg(`/signup?orgslug=${orgslug}`))
      return
    }
    const action = isStarted ? removeSubject : startSubject
    await action(
      'subject_' + subjectuuid,
      orgslug,
      session.data?.tokens?.access_token
    )
    await revalidateTags(['subjects'], orgslug)
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse h-20 bg-gray-100 rounded-lg nice-shadow" />
    )
  }

  if (linkedProducts.length > 0) {
    return (
      <div className="space-y-4">
        {hasAccess ? (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg nice-shadow">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="text-green-800 font-semibold">
                  You Own This Subject
                </h3>
              </div>
              <p className="text-green-700 text-sm mt-1">
                You have purchased this subject and have full access to all
                content.
              </p>
            </div>
            <button
              onClick={handleSubjectAction}
              className={`w-full py-3 rounded-lg nice-shadow font-semibold transition-colors flex items-center justify-center gap-2 ${
                isStarted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {isStarted ? (
                <>
                  <LogOut className="w-5 h-5" />
                  Leave Subject
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Start Subject
                </>
              )}
            </button>
          </>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg nice-shadow">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800" />
              <h3 className="text-amber-800 font-semibold">Paid Subject</h3>
            </div>
            <p className="text-amber-700 text-sm mt-1">
              This subject requires purchase to access its content.
            </p>
          </div>
        )}

        {!hasAccess && (
          <>
            <Modal
              isDialogOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              dialogContent={<SubjectPaidOptions subject={subject} />}
              dialogTitle="Purchase Subject"
              dialogDescription="Select a payment option to access this subject"
              minWidth="sm"
            />
            <button
              className="w-full bg-neutral-900 text-white py-3 rounded-lg nice-shadow font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              Purchase Subject
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleSubjectAction}
      className={`w-full py-3 rounded-lg nice-shadow font-semibold transition-colors flex items-center justify-center gap-2 ${
        isStarted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-neutral-900 text-white hover:bg-neutral-800'
      }`}
    >
      {!session.data?.user ? (
        <>
          <LogIn className="w-5 h-5" />
          Authenticate to start subject
        </>
      ) : isStarted ? (
        <>
          <LogOut className="w-5 h-5" />
          Leave Subject
        </>
      ) : (
        <>
          <LogIn className="w-5 h-5" />
          Start Subject
        </>
      )}
    </button>
  )
}

function SubjectsActions({
  subjectuuid,
  orgslug,
  subject,
}: SubjectActionsProps) {
  const router = useRouter()
  const session = useLHSession() as any
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className=" space-y-3  antialiased flex flex-col   p-3 py-5 bg-white shadow-md shadow-gray-300/25 outline outline-1 outline-neutral-200/40 rounded-lg overflow-hidden">
      <AuthorInfo author={subject.authors[0]} isMobile={isMobile} />
      <div className="px-3 py-2">
        <Actions
          subjectuuid={subjectuuid}
          orgslug={orgslug}
          subject={subject}
        />
      </div>
    </div>
  )
}

export default SubjectsActions
