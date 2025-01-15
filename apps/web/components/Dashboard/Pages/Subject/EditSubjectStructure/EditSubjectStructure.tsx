'use client'
import { getAPIUrl } from '@services/config/config'
import { revalidateTags } from '@services/utils/ts/requests'
import React, { useEffect, useState } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { mutate } from 'swr'
import ChapterElement from './DraggableElements/ChapterElement'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import { createChapter } from '@services/subjects/chapters'
import { useRouter } from 'next/navigation'
import {
  useSubject,
  useSubjectDispatch,
} from '@components/Contexts/SubjectContext'
import { Hexagon } from 'lucide-react'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import NewChapterModal from '@components/Objects/Modals/Chapters/NewChapter'
import { useLHSession } from '@components/Contexts/LHSessionContext'

type EditSubjectStructureProps = {
  orgslug: string
  subject_uuid?: string
}

export type OrderPayload =
  | {
      chapter_order_by_ids: [
        {
          chapter_id: string
          activities_order_by_ids: [
            {
              activity_id: string
            },
          ]
        },
      ]
    }
  | undefined

const EditSubjectStructure = (props: EditSubjectStructureProps) => {
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  // Check window availability
  const [winReady, setwinReady] = useState(false)

  const dispatchSubject = useSubjectDispatch() as any

  const [order, setOrder] = useState<OrderPayload>()
  const subject = useSubject() as any
  const subject_structure = subject ? subject.subjectStructure : {}
  const subject_uuid = subject ? subject.subjectStructure.subject_uuid : ''

  // New Chapter creation
  const [newChapterModal, setNewChapterModal] = useState(false)

  const closeNewChapterModal = async () => {
    setNewChapterModal(false)
  }

  // Submit new chapter
  const submitChapter = async (chapter: any) => {
    await createChapter(chapter, access_token)
    mutate(
      `${getAPIUrl()}subjects/${subject.subjectStructure.subject_uuid}/meta`
    )
    await revalidateTags(['subjects'], props.orgslug)
    router.refresh()
    setNewChapterModal(false)
  }

  const updateStructure = (result: any) => {
    const { destination, source, draggableId, type } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return
    if (type === 'chapter') {
      const newChapterOrder = Array.from(subject_structure.chapters)
      newChapterOrder.splice(source.index, 1)
      newChapterOrder.splice(
        destination.index,
        0,
        subject_structure.chapters[source.index]
      )
      dispatchSubject({
        type: 'setSubjectStructure',
        payload: { ...subject_structure, chapters: newChapterOrder },
      })
      dispatchSubject({ type: 'setIsNotSaved' })
    }
    if (type === 'activity') {
      const newChapterOrder = Array.from(subject_structure.chapters)
      const sourceChapter = newChapterOrder.find(
        (chapter: any) => chapter.chapter_uuid === source.droppableId
      ) as any
      const destinationChapter = newChapterOrder.find(
        (chapter: any) => chapter.chapter_uuid === destination.droppableId
      )
        ? newChapterOrder.find(
            (chapter: any) => chapter.chapter_uuid === destination.droppableId
          )
        : sourceChapter
      const activity = sourceChapter.activities.find(
        (activity: any) => activity.activity_uuid === draggableId
      )
      sourceChapter.activities.splice(source.index, 1)
      destinationChapter.activities.splice(destination.index, 0, activity)
      dispatchSubject({
        type: 'setSubjectStructure',
        payload: { ...subject_structure, chapters: newChapterOrder },
      })
      dispatchSubject({ type: 'setIsNotSaved' })
    }
  }

  useEffect(() => {
    setwinReady(true)
  }, [props.subject_uuid, subject_structure, subject])

  if (!subject) return <PageLoading></PageLoading>

  return (
    <div className="flex flex-col">
      <div className="h-6"></div>
      {winReady ? (
        <DragDropContext onDragEnd={updateStructure}>
          <Droppable type="chapter" droppableId="chapters">
            {(provided) => (
              <div
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {subject_structure.chapters &&
                  subject_structure.chapters.map((chapter: any, index: any) => {
                    return (
                      <ChapterElement
                        key={chapter.chapter_uuid}
                        chapterIndex={index}
                        orgslug={props.orgslug}
                        subject_uuid={subject_uuid}
                        chapter={chapter}
                      />
                    )
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* New Chapter Modal */}
          <Modal
            isDialogOpen={newChapterModal}
            onOpenChange={setNewChapterModal}
            minHeight="sm"
            dialogContent={
              <NewChapterModal
                subject={subject ? subject.subjectStructure : null}
                closeModal={closeNewChapterModal}
                submitChapter={submitChapter}
              ></NewChapterModal>
            }
            dialogTitle="Create chapter"
            dialogDescription="Add a new chapter to the subject"
            dialogTrigger={
              <div className="w-44 my-16 py-5 max-w-screen-2xl mx-auto bg-cyan-800 text-white rounded-xl shadow-sm px-6 items-center flex flex-row h-10">
                <div className="mx-auto flex space-x-2 items-center hover:cursor-pointer">
                  <Hexagon
                    strokeWidth={3}
                    size={16}
                    className="text-white text-sm "
                  />
                  <div className="font-bold text-sm">Add Chapter</div>
                </div>
              </div>
            }
          />
        </DragDropContext>
      ) : (
        <></>
      )}
    </div>
  )
}

export default EditSubjectStructure
