import { useSubject } from '@components/Contexts/SubjectContext'
import { useEffect } from 'react'
import BreadCrumbs from './BreadCrumbs'
import SaveState from './SaveState'
import { SubjectOverviewParams } from 'app/orgs/[orgslug]/dash/subjects/subject/[subjectuuid]/[subpage]/page'
import { getUriWithOrg } from '@services/config/config'
import { useOrg } from '@components/Contexts/OrgContext'
import Link from 'next/link'
import Image from 'next/image'
import EmptyThumbnailImage from '../../../public/empty_thumbnail.png'

export function SubjectOverviewTop({
  params,
}: {
  params: SubjectOverviewParams
}) {
  const subject = useSubject() as any
  const org = useOrg() as any

  useEffect(() => {}, [subject, org])

  return (
    <>
      <BreadCrumbs
        type="subjects"
        last_breadcrumb={subject.subjectStructure.name}
      ></BreadCrumbs>
      <div className="flex">
        <div className="flex py-3 grow items-center">
          <Link
            href={
              getUriWithOrg(org?.slug, '') + `/subject/${params.subjectuuid}`
            }
          >
            {subject?.subjectStructure?.thumbnail_image ? (
              <img
                className="w-[100px] h-[57px] rounded-md drop-shadow-md"
                src=""
                alt=""
              />
            ) : (
              <Image
                width={100}
                className="h-[57px] rounded-md drop-shadow-md"
                src={EmptyThumbnailImage}
                alt=""
              />
            )}
          </Link>
          <div className="flex flex-col subject_metadata justify-center pl-5">
            <div className="text-gray-400 font-semibold text-sm">Subject</div>
            <div className="text-black font-bold text-xl -mt-1 first-letter:uppercase">
              {subject.subjectStructure.name}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <SaveState orgslug={params.orgslug} />
        </div>
      </div>
    </>
  )
}
