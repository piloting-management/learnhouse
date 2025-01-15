from datetime import datetime
from typing import List, Literal
from uuid import uuid4
from sqlmodel import Session, select
from src.db.users import AnonymousUser
from src.security.rbac.rbac import (
    authorization_verify_based_on_roles_and_authorship,
    authorization_verify_if_element_is_public,
    authorization_verify_if_user_is_anon,
)
from src.db.collections import (
    Collection,
    CollectionCreate,
    CollectionRead,
    CollectionUpdate,
)
from src.db.collections_subjects import CollectionSubject
from src.db.subjects.subjects import Subject
from src.services.users.users import PublicUser
from fastapi import HTTPException, status, Request


####################################################
# CRUD
####################################################


async def get_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> CollectionRead:
    statement = select(Collection).where(Collection.collection_uuid == collection_uuid)
    collection = db_session.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Collection does not exist"
        )

    # RBAC check
    await rbac_check(
        request, collection.collection_uuid, current_user, "read", db_session
    )

    # get subjects in collection
    statement_all = (
        select(Subject)
        .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
        .where(CollectionSubject.org_id == collection.org_id)
        .distinct(Subject.id)
    )

    statement_public = (
        select(Subject)
        .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
        .where(CollectionSubject.org_id == collection.org_id, Subject.public == True)
    )

    if current_user.user_uuid == "user_anonymous":
        statement = statement_public
    else:
        statement = statement_all

    subjects = db_session.exec(statement).all()

    collection = CollectionRead(**collection.model_dump(), subjects=subjects)

    return collection


async def create_collection(
    request: Request,
    collection_object: CollectionCreate,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    collection = Collection.model_validate(collection_object)

    # RBAC check
    await rbac_check(request, "collection_x", current_user, "create", db_session)

    # Complete the collection object
    collection.collection_uuid = f"collection_{uuid4()}"
    collection.creation_date = str(datetime.now())
    collection.update_date = str(datetime.now())

    # Add collection to database
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    # Link subjects to collection
    if collection:
        for subject_id in collection_object.subjects:
            collection_course = CollectionSubject(
                collection_id=int(collection.id),  # type: ignore
                subject_id=subject_id,
                org_id=int(collection_object.org_id),
                creation_date=str(datetime.now()),
                update_date=str(datetime.now()),
            )
            # Add collection_course to database
            db_session.add(collection_course)

    db_session.commit()
    db_session.refresh(collection)

    # Get subjects once again
    statement = (
        select(Subject)
        .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
        .distinct(Subject.id)
    )
    subjects = db_session.exec(statement).all()

    collection = CollectionRead(**collection.model_dump(), subjects=subjects)

    return CollectionRead.model_validate(collection)


async def update_collection(
    request: Request,
    collection_object: CollectionUpdate,
    collection_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    statement = select(Collection).where(Collection.collection_uuid == collection_uuid)
    collection = db_session.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Collection does not exist"
        )

    # RBAC check
    await rbac_check(
        request, collection.collection_uuid, current_user, "update", db_session
    )

    subjects = collection_object.subjects

    del collection_object.subjects

    # Update only the fields that were passed in
    for var, value in vars(collection_object).items():
        if value is not None:
            setattr(collection, var, value)

    collection.update_date = str(datetime.now())

    # Update only the fields that were passed in
    for var, value in vars(collection_object).items():
        if value is not None:
            setattr(collection, var, value)

    statement = select(CollectionSubject).where(
        CollectionSubject.collection_id == collection.id
    )
    collection_subjects = db_session.exec(statement).all()

    # Delete all collection_subjects
    for collection_course in collection_subjects:
        db_session.delete(collection_course)

    # Add new collection_subjects
    for course in subjects or []:
        collection_course = CollectionSubject(
            collection_id=int(collection.id),  # type: ignore
            subject_id=int(course),
            org_id=int(collection.org_id),
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
        # Add collection_course to database
        db_session.add(collection_course)

    db_session.commit()
    db_session.refresh(collection)

    # Get subjects once again
    statement = (
        select(Subject)
        .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
        .where(Subject.org_id == collection.org_id)
        .distinct(Subject.id)
    )

    subjects = db_session.exec(statement).all()

    collection = CollectionRead(**collection.model_dump(), subjects=subjects)

    return collection


async def delete_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser,
    db_session: Session,
):
    statement = select(Collection).where(Collection.collection_uuid == collection_uuid)
    collection = db_session.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=404,
            detail="Collection not found",
        )

    # RBAC check
    await rbac_check(
        request, collection.collection_uuid, current_user, "delete", db_session
    )

    # delete collection from database
    db_session.delete(collection)
    db_session.commit()

    return {"detail": "Collection deleted"}


####################################################
# Misc
####################################################


async def get_collections(
    request: Request,
    org_id: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    page: int = 1,
    limit: int = 10,
) -> List[CollectionRead]:

    statement_public = select(Collection).where(
        Collection.org_id == org_id, Collection.public == True
    )
    statement_all = (
        select(Collection).where(Collection.org_id == org_id).distinct(Collection.id)
    )

    if current_user.id == 0:
        statement = statement_public
    else:
        statement = statement_all

    collections = db_session.exec(statement).all()

    collections_with_subjects = []

    for collection in collections:
        statement_all = (
            select(Subject)
            .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
            .where(CollectionSubject.org_id == collection.org_id)
            .distinct(Subject.id)
        )
        statement_public = (
            select(Subject)
            .join(CollectionSubject, Subject.id == CollectionSubject.subject_id)
            .where(CollectionSubject.org_id == org_id, Subject.public == True)
        )
        if current_user.id == 0:
            statement = statement_public
        else:
            # RBAC check
            statement = statement_all

        subjects = db_session.exec(statement).all()

        collection = CollectionRead(**collection.model_dump(), subjects=subjects)
        collections_with_subjects.append(collection)

    return collections_with_subjects


## 🔒 RBAC Utils ##


async def rbac_check(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    action: Literal["create", "read", "update", "delete"],
    db_session: Session,
):
    if action == "read":
        if current_user.id == 0:  # Anonymous user
            res = await authorization_verify_if_element_is_public(
                request, collection_uuid, action, db_session
            )
            if res == False:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User rights : You are not allowed to read this collection",
                )
        else:
            res = (
                await authorization_verify_based_on_roles_and_authorship(
                    request, current_user.id, action, collection_uuid, db_session
                )
            )
            return res
    else:
        await authorization_verify_if_user_is_anon(current_user.id)

        await authorization_verify_based_on_roles_and_authorship(
            request,
            current_user.id,
            action,
            collection_uuid,
            db_session,
        )


## 🔒 RBAC Utils ##
