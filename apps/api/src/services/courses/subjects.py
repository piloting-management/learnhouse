from typing import Literal, List
from uuid import uuid4
from sqlmodel import Session, select, or_, and_
from src.db.courses.courses import Course

from src.db.subjects.subjects_courses import SubjectCourse
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.organizations import Organization
from src.security.features_utils.usage import (
    check_limits_with_usage,
    decrease_feature_usage,
    increase_feature_usage,
)
from src.services.trail.trail import get_user_trail_with_orgid
from src.db.resource_authors import ResourceAuthor, ResourceAuthorshipEnum
from src.db.users import PublicUser, AnonymousUser, User, UserRead
from src.db.subjects.subjects import (
    Subject,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
)
from src.security.rbac.rbac import (
    authorization_verify_based_on_roles_and_authorship,
    authorization_verify_if_element_is_public,
    authorization_verify_if_user_is_anon,
)

# from src.services.subjects.thumbnails import upload_thumbnail
from fastapi import HTTPException, Request, UploadFile
from datetime import datetime


async def get_subject(
    request: Request,
    subject_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    statement = select(Subject).where(Subject.subject_uuid == subject_uuid)
    subject = db_session.exec(statement).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # RBAC check
    await rbac_check(request, subject.subject_uuid, current_user, "read", db_session)

    # Get subject authors
    authors_statement = (
        select(User)
        .join(ResourceAuthor)
        .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
    )
    authors = db_session.exec(authors_statement).all()

    # convert from User to UserRead
    authors = [UserRead.model_validate(author) for author in authors]

    subject = SubjectRead(**subject.model_dump(), authors=authors)

    return subject


async def get_subject_by_id(
    request: Request,
    subject_id: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    statement = select(Subject).where(Subject.id == subject_id)
    subject = db_session.exec(statement).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # RBAC check
    await rbac_check(request, subject.subject_uuid, current_user, "read", db_session)

    # Get subject authors
    authors_statement = (
        select(User)
        .join(ResourceAuthor)
        .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
    )
    authors = db_session.exec(authors_statement).all()

    # convert from User to UserRead
    authors = [UserRead.model_validate(author) for author in authors]

    subject = SubjectRead(**subject.model_dump(), authors=authors)

    return subject

async def get_subjects(
    request: Request,
    org_id: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    page: int = 1,
    limit: int = 10,
) -> List[SubjectRead]:

    statement_public = select(Subject).where(
        Subject.org_id == org_id, Subject.public == True
    )
    statement_all = (
        select(Subject).where(Subject.org_id == org_id).distinct(Subject.id)
    )

    if current_user.id == 0:
        statement = statement_public
    else:
        statement = statement_all

    subjects = db_session.exec(statement).all()

    subjects_with_courses = []

    for subject in subjects:
        statement_all = (
            select(Subject)
            .join(SubjectCourse, Course.id == SubjectCourse.course_id)
            .where(SubjectCourse.org_id == subject.org_id,
                   SubjectCourse.subject_id == subject.id)
            .distinct(Course.id)
        )
        statement_public = (
            select(Course)
            .join(SubjectCourse, Course.id == SubjectCourse.course_id)
            .where(SubjectCourse.org_id == org_id, SubjectCourse.subject_id == subject.id, Course.public == True)
        )
        if current_user.id == 0:
            statement = statement_public
        else:
            # RBAC check
            statement = statement_all

        courses = db_session.exec(statement).all()

        subject = SubjectRead(**subject.model_dump(), courses=courses)
        subjects_with_courses.append(subject)

    return subjects_with_courses

# async def get_subject_meta(
#     request: Request,
#     subject_uuid: str,
#     current_user: PublicUser | AnonymousUser,
#     db_session: Session,
# ) -> FullSubjectReadWithTrail:
#     # Avoid circular import
#     from src.services.subjects.chapters import get_subject_chapters

#     subject_statement = select(Subject).where(Subject.subject_uuid == subject_uuid)
#     subject = db_session.exec(subject_statement).first()

#     if not subject:
#         raise HTTPException(
#             status_code=404,
#             detail="Subject not found",
#         )

#     # RBAC check
#     await rbac_check(request, subject.subject_uuid, current_user, "read", db_session)

#     # Get subject authors
#     authors_statement = (
#         select(User)
#         .join(ResourceAuthor)
#         .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
#     )
#     authors = db_session.exec(authors_statement).all()

#     # convert from User to UserRead
#     authors = [UserRead.model_validate(author) for author in authors]

#     subject = SubjectRead(**subject.model_dump(), authors=authors)

#     # Get subject chapters
#     chapters = await get_subject_chapters(request, subject.id, db_session, current_user)

#     # Trail
#     trail = None

#     if isinstance(current_user, AnonymousUser):
#         trail = None
#     else:
#         trail = await get_user_trail_with_orgid(
#             request, current_user, subject.org_id, db_session
#         )

#     return FullSubjectReadWithTrail(
#         **subject.model_dump(),
#         chapters=chapters,
#         trail=trail if trail else None,
#     )

async def get_subjects_orgslug(
    request: Request,
    current_user: PublicUser | AnonymousUser,
    org_slug: str,
    db_session: Session,
    page: int = 1,
    limit: int = 10,
) -> List[SubjectRead]:
    offset = (page - 1) * limit

    # Base query
    query = (
        select(Subject)
        .join(Organization)
        .where(Organization.slug == org_slug)
    )

    if isinstance(current_user, AnonymousUser):
        # For anonymous users, only show public subjects
        query = query.where(Subject.public == True)
    else:
        # For authenticated users, show:
        # 1. Public subjects
        # 2. Subjects not in any UserGroup
        # 3. Subjects in UserGroups where the user is a member
        # 4. Subjects where the user is a resource author
        query = (
            query
            .outerjoin(UserGroupResource, UserGroupResource.resource_uuid == Subject.subject_uuid)  # type: ignore
            .outerjoin(UserGroupUser, and_(
                UserGroupUser.usergroup_id == UserGroupResource.usergroup_id,
                UserGroupUser.user_id == current_user.id
            ))
            .outerjoin(ResourceAuthor, ResourceAuthor.resource_uuid == Subject.subject_uuid)  # type: ignore
            .where(or_(
                Subject.public == True,
                UserGroupResource.resource_uuid == None,  # Subjects not in any UserGroup # noqa: E711
                UserGroupUser.user_id == current_user.id,  # Subjects in UserGroups where user is a member
                ResourceAuthor.user_id == current_user.id  # Subjects where user is a resource author
            ))
        )

    # Apply pagination
    query = query.offset(offset).limit(limit).distinct()

    subjects = db_session.exec(query).all()

    # Fetch authors for each subject
    subject_reads = []
    for subject in subjects:
        authors_query = (
            select(User)
            .join(ResourceAuthor, ResourceAuthor.user_id == User.id)  # type: ignore
            .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
        )
        authors = db_session.exec(authors_query).all()
        
        subject_read = SubjectRead.model_validate(subject)
        subject_read.authors = [UserRead.model_validate(author) for author in authors]
        subject_reads.append(subject_read)

    return subject_reads


async def create_subject(
    request: Request,
    org_id: int,
    subject_object: SubjectCreate,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    thumbnail_file: UploadFile | None = None,
):
    subject = Subject.model_validate(subject_object)

    # RBAC check
    await rbac_check(request, "subject_x", current_user, "create", db_session)

    # Usage check
    check_limits_with_usage("subjects", org_id, db_session)

    # Complete subject object
    subject.org_id = subject.org_id

    # Get org uuid
    org_statement = select(Organization).where(Organization.id == org_id)
    org = db_session.exec(org_statement).first()

    subject.subject_uuid = str(f"subject_{uuid4()}")
    subject.creation_date = str(datetime.now())
    subject.update_date = str(datetime.now())

    # # Upload thumbnail
    # if thumbnail_file and thumbnail_file.filename:
    #     name_in_disk = f"{subject.subject_uuid}_thumbnail_{uuid4()}.{thumbnail_file.filename.split('.')[-1]}"
    #     await upload_thumbnail(
    #         thumbnail_file, name_in_disk, org.org_uuid, subject.subject_uuid  # type: ignore
    #     )
    #     subject.thumbnail_image = name_in_disk

    # else:
    #     subject.thumbnail_image = ""

    # Insert subject
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)

    # Make the user the creator of the subject
    resource_author = ResourceAuthor(
        resource_uuid=subject.subject_uuid,
        user_id=current_user.id,
        authorship=ResourceAuthorshipEnum.CREATOR,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )

    # Insert subject author
    db_session.add(resource_author)
    db_session.commit()
    db_session.refresh(resource_author)

    # Get subject authors
    authors_statement = (
        select(User)
        .join(ResourceAuthor)
        .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
    )
    authors = db_session.exec(authors_statement).all()

    # Feature usage
    increase_feature_usage("subjects", subject.org_id, db_session)

    # convert from User to UserRead
    authors = [UserRead.model_validate(author) for author in authors]

    subject = SubjectRead(**subject.model_dump(), authors=authors)

    return SubjectRead.model_validate(subject)


async def update_subject_thumbnail(
    request: Request,
    subject_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    thumbnail_file: UploadFile | None = None,
):
    statement = select(Subject).where(Subject.subject_uuid == subject_uuid)
    subject = db_session.exec(statement).first()

    name_in_disk = None

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # RBAC check
    await rbac_check(request, subject.subject_uuid, current_user, "update", db_session)

    # Get org uuid
    org_statement = select(Organization).where(Organization.id == subject.org_id)
    org = db_session.exec(org_statement).first()

    # # Upload thumbnail
    # if thumbnail_file and thumbnail_file.filename:
    #     name_in_disk = f"{subject_uuid}_thumbnail_{uuid4()}.{thumbnail_file.filename.split('.')[-1]}"
    #     await upload_thumbnail(
    #         thumbnail_file, name_in_disk, org.org_uuid, subject.subject_uuid  # type: ignore
    #     )

    # Update subject
    if name_in_disk:
        subject.thumbnail_image = name_in_disk
    else:
        raise HTTPException(
            status_code=500,
            detail="Issue with thumbnail upload",
        )

    # Complete the subject object
    subject.update_date = str(datetime.now())

    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)

    # Get subject authors
    authors_statement = (
        select(User)
        .join(ResourceAuthor)
        .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
    )
    authors = db_session.exec(authors_statement).all()

    # convert from User to UserRead
    authors = [UserRead.model_validate(author) for author in authors]

    subject = SubjectRead(**subject.model_dump(), authors=authors)

    return subject


async def update_subject(
    request: Request,
    subject_object: SubjectUpdate,
    subject_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    statement = select(Subject).where(Subject.subject_uuid == subject_uuid)
    subject = db_session.exec(statement).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # RBAC check
    await rbac_check(request, subject.subject_uuid, current_user, "update", db_session)

    # Update only the fields that were passed in
    for var, value in vars(subject_object).items():
        if value is not None:
            setattr(subject, var, value)

    # Complete the subject object
    subject.update_date = str(datetime.now())

    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)

    # Get subject authors
    authors_statement = (
        select(User)
        .join(ResourceAuthor)
        .where(ResourceAuthor.resource_uuid == subject.subject_uuid)
    )
    authors = db_session.exec(authors_statement).all()

    # convert from User to UserRead
    authors = [UserRead.model_validate(author) for author in authors]

    subject = SubjectRead(**subject.model_dump(), authors=authors)

    return subject


async def delete_subject(
    request: Request,
    subject_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    statement = select(Subject).where(Subject.subject_uuid == subject_uuid)
    subject = db_session.exec(statement).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # RBAC check
    await rbac_check(request, subject.subject_uuid, current_user, "delete", db_session)

    # Feature usage
    decrease_feature_usage("subjects", subject.org_id, db_session)

    db_session.delete(subject)
    db_session.commit()

    return {"detail": "Subject deleted"}





## 🔒 RBAC Utils ##


async def rbac_check(
    request: Request,
    subject_uuid: str,
    current_user: PublicUser | AnonymousUser,
    action: Literal["create", "read", "update", "delete"],
    db_session: Session,
):
    if action == "read":
        if current_user.id == 0:  # Anonymous user
            res = await authorization_verify_if_element_is_public(
                request, subject_uuid, action, db_session
            )
            return res
        else:
            res = (
                await authorization_verify_based_on_roles_and_authorship(
                    request, current_user.id, action, subject_uuid, db_session
                )
            )
            return res
    else:
        await authorization_verify_if_user_is_anon(current_user.id)

        await authorization_verify_based_on_roles_and_authorship(
            request,
            current_user.id,
            action,
            subject_uuid,
            db_session,
        )