'use client'
import { getUriWithOrg } from '@services/config/config'
import React from 'react'
import { SubjectProvider } from '../../../../../../../../components/Contexts/SubjectContext'
import Link from 'next/link'
import { SubjectOverviewTop } from '@components/Dashboard/Misc/SubjectOverviewTop'
import { motion } from 'framer-motion'
import { GalleryVerticalEnd, Info, UserRoundCog } from 'lucide-react'
import EditSubjectStructure from '@components/Dashboard/Pages/Subject/EditSubjectStructure/EditSubjectStructure'
import EditSubjectGeneral from '@components/Dashboard/Pages/Subject/EditSubjectGeneral/EditSubjectGeneral'
import EditSubjectAccess from '@components/Dashboard/Pages/Subject/EditSubjectAccess/EditSubjectAccess'

export type SubjectOverviewParams = {
  orgslug: string
  subjectuuid: string
  subpage: string
}

function SubjectOverviewPage({ params }: { params: SubjectOverviewParams }) {
  function getEntireSubjectUUID(subjectuuid: string) {
    // add subject_ to uuid
    return `subject_${subjectuuid}`
  }

  return (
    <div className="h-screen w-full bg-[#f8f8f8] grid grid-rows-[auto,1fr]">
      <SubjectProvider subjectuuid={getEntireSubjectUUID(params.subjectuuid)}>
        <div className="pl-10 pr-10 text-sm tracking-tight bg-[#fcfbfc] z-10 shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
          <SubjectOverviewTop params={params} />
          <div className="flex space-x-3 font-black text-sm">
            <Link
              href={
                getUriWithOrg(params.orgslug, '') +
                `/dash/subjects/subject/${params.subjectuuid}/general`
              }
            >
              <div
                className={`flex space-x-4 py-2 w-fit text-center border-black transition-all ease-linear ${
                  params.subpage.toString() === 'general'
                    ? 'border-b-4'
                    : 'opacity-50'
                } cursor-pointer`}
              >
                <div className="flex items-center space-x-2.5 mx-2">
                  <Info size={16} />
                  <div>General</div>
                </div>
              </div>
            </Link>
            <Link
              href={
                getUriWithOrg(params.orgslug, '') +
                `/dash/subjects/subject/${params.subjectuuid}/access`
              }
            >
              <div
                className={`flex space-x-4 py-2 w-fit text-center border-black transition-all ease-linear ${
                  params.subpage.toString() === 'access'
                    ? 'border-b-4'
                    : 'opacity-50'
                } cursor-pointer`}
              >
                <div className="flex items-center space-x-2.5 mx-2">
                  <UserRoundCog size={16} />
                  <div>Access</div>
                </div>
              </div>
            </Link>
            <Link
              href={
                getUriWithOrg(params.orgslug, '') +
                `/dash/subjects/subject/${params.subjectuuid}/content`
              }
            >
              <div
                className={`flex space-x-4 py-2 w-fit text-center border-black transition-all ease-linear ${
                  params.subpage.toString() === 'content'
                    ? 'border-b-4'
                    : 'opacity-50'
                } cursor-pointer`}
              >
                <div className="flex items-center space-x-2.5 mx-2">
                  <GalleryVerticalEnd size={16} />
                  <div>Content</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, type: 'spring', stiffness: 80 }}
          className="h-full overflow-y-auto"
        >
          {params.subpage == 'content' ? (
            <EditSubjectStructure orgslug={params.orgslug} />
          ) : (
            ''
          )}
          {params.subpage == 'general' ? (
            <EditSubjectGeneral orgslug={params.orgslug} />
          ) : (
            ''
          )}
          {params.subpage == 'access' ? (
            <EditSubjectAccess orgslug={params.orgslug} />
          ) : (
            ''
          )}
        </motion.div>
      </SubjectProvider>
    </div>
  )
}

export default SubjectOverviewPage
