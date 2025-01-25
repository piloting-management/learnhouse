from typing import List
from fastapi import APIRouter, Depends, UploadFile, Form, Request
from sqlmodel import Session
from src.core.events.database import get_db_session
from src.db.subjects.subject_updates import (
    SubjectUpdateCreate,
    SubjectUpdateRead,
    SubjectUpdateUpdate,
)
from src.db.users import PublicUser
from src.db.subjects.subjects import (
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
)
from src.security.auth import get_current_user
from src.services.courses.subjects import (
    create_subject,
    get_subject,
    get_subjects,
    get_subject_by_id,
    update_subject,
    delete_subject,
    update_subject_thumbnail,
)
from src.services.courses.updates import (
    create_update,
    delete_update,
    update_update,
)


router = APIRouter()


@router.post("/")
async def api_create_subject(
    request: Request,
    org_id: int,
    name: str = Form(),
    description: str = Form(),
    public: bool = Form(),
    learnings: str = Form(None),
    tags: str = Form(None),
    about: str = Form(),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
    thumbnail: UploadFile | None = None,
) -> SubjectRead:
    """
    Create new Subject
    """
    subject = SubjectCreate(
        name=name,
        description=description,
        org_id=org_id,
        public=public,
        thumbnail_image="",
        about=about,
        learnings=learnings,
        tags=tags,
    )
    return await create_subject(
        request, org_id, subject, current_user, db_session, thumbnail
    )


@router.put("/{subject_uuid}/thumbnail")
async def api_create_subject_thumbnail(
    request: Request,
    subject_uuid: str,
    thumbnail: UploadFile | None = None,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectRead:
    """
    Update new Subject Thumbnail
    """
    return await update_subject_thumbnail(
        request, subject_uuid, current_user, db_session, thumbnail
    )


@router.get("/{subject_uuid}")
async def api_get_subject(
    request: Request,
    subject_uuid: str,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectRead:
    """
    Get single Subject by subject_uuid
    """
    return await get_subject(
        request, subject_uuid, current_user=current_user, db_session=db_session
    )


@router.get("/id/{subject_id}")
async def api_get_subject_by_id(
    request: Request,
    subject_id: str,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectRead:
    """
    Get single Subject by id
    """
    return await get_subject_by_id(
        request, subject_id, current_user=current_user, db_session=db_session
    )


# @router.get("/{subject_uuid}/meta")
# async def api_get_subject_meta(
#     request: Request,
#     subject_uuid: str,
#     db_session: Session = Depends(get_db_session),
#     current_user: PublicUser = Depends(get_current_user),
# ) -> FullSubjectReadWithTrail:
#     """
#     Get single Subject Metadata (chapters, activities) by subject_uuid
#     """
#     return await get_subject_meta(
#         request, subject_uuid, current_user=current_user, db_session=db_session
#     )

# @router.get("/org_slug/{org_slug}/page/{page}/limit/{limit}")
# async def api_get_subject_by_orgslug(
#     request: Request,
#     page: int,
#     limit: int,
#     org_slug: str,
#     db_session: Session = Depends(get_db_session),
#     current_user: PublicUser = Depends(get_current_user),
# ) -> List[SubjectRead]:
#     """
#     Get subjects by page and limit
#     """
#     return await get_subjects_orgslug(
#         request, current_user, org_slug, db_session, page, limit
#     )

@router.get("/org/{org_id}/page/{page}/limit/{limit}")
async def api_get_subjects_by(
    request: Request,
    page: int,
    limit: int,
    org_id: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> List[SubjectRead]:
    """
    Get subjects by page and limit
    """
    return await get_subjects(request, org_id, current_user, db_session, page, limit)


@router.put("/{subject_uuid}")
async def api_update_subject(
    request: Request,
    subject_object: SubjectUpdate,
    subject_uuid: str,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectRead:
    """
    Update Subject by subject_uuid
    """
    return await update_subject(
        request, subject_object, subject_uuid, current_user, db_session
    )


@router.delete("/{subject_uuid}")
async def api_delete_subject(
    request: Request,
    subject_uuid: str,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
):
    """
    Delete Subject by ID
    """

    return await delete_subject(request, subject_uuid, current_user, db_session)


# @router.get("/{subject_uuid}/updates")
# async def api_get_subject_updates(
#     request: Request,
#     subject_uuid: str,
#     db_session: Session = Depends(get_db_session),
#     current_user: PublicUser = Depends(get_current_user),
# ) -> List[SubjectUpdateRead]:
#     """
#     Get Subject Updates by subject_uuid
#     """

#     return await get_updates_by_subject_uuid(
#         request, subject_uuid, current_user, db_session
#     )


@router.post("/{subject_uuid}/updates")
async def api_create_subject_update(
    request: Request,
    subject_uuid: str,
    update_object: SubjectUpdateCreate,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectUpdateRead:
    """
    Create new Subject Update
    """

    return await create_update(
        request, subject_uuid, update_object, current_user, db_session
    )


@router.put("/{subject_uuid}/update/{subjectupdate_uuid}")
async def api_update_subject_update(
    request: Request,
    subject_uuid: str,
    subjectupdate_uuid: str,
    update_object: SubjectUpdateUpdate,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
) -> SubjectUpdateRead:
    """
    Update Subject Update by subjectupdate_uuid
    """

    return await update_update(
        request, subjectupdate_uuid, update_object, current_user, db_session
    )


@router.delete("/{subject_uuid}/update/{subjectupdate_uuid}")
async def api_delete_subject_update(
    request: Request,
    subject_uuid: str,
    subjectupdate_uuid: str,
    db_session: Session = Depends(get_db_session),
    current_user: PublicUser = Depends(get_current_user),
):
    """
    Delete Subject Update by subjectupdate_uuid
    """

    return await delete_update(request, subjectupdate_uuid, current_user, db_session)
