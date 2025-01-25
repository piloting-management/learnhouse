from typing import List, Optional
from sqlalchemy import Column, ForeignKey, Integer
from sqlmodel import Field, SQLModel

class SubjectBase(SQLModel):
    name: str
    description: Optional[str]
    about: Optional[str]
    learnings: Optional[str]
    tags: Optional[str]
    thumbnail_image: Optional[str]
    public: bool


class Subject(SubjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    subject_uuid: str = ""   
    creation_date: str = ""
    update_date: str = ""


class SubjectCreate(SubjectBase):
    org_id: int = Field(default=None, foreign_key="organization.id")
    pass


class SubjectUpdate(SubjectBase):
    name: str
    description: Optional[str]
    about: Optional[str]
    learnings: Optional[str]
    tags: Optional[str]
    public: Optional[bool]



class FullSubjectRead(SubjectBase):
    id: int
    subject_uuid: Optional[str]
    creation_date: Optional[str]
    update_date: Optional[str]
    pass

class SubjectRead(SubjectBase):
    id: int
    courses: list
    subject_uuid: str
    creation_date: str
    update_date: str
    pass

# class SubjectRead(SubjectBase):
#     id: int
#     org_id: int = Field(default=None, foreign_key="organization.id")
#     authors: Optional[List["SubjectRead"]]
#     course_uuid: str
#     creation_date: str
#     update_date: str
#     pass