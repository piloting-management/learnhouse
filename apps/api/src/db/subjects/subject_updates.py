from typing import Optional
from sqlalchemy import Column, ForeignKey, Integer
from sqlmodel import Field, SQLModel


class SubjectUpdate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subjectupdate_uuid: str
    title: str 
    content: str 
    subject_id: int = Field(
        sa_column=Column(Integer, ForeignKey("subject.id", ondelete="CASCADE"))
    )
    linked_activity_uuids: Optional[str] = Field(default=None)
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    creation_date: str
    update_date: str

class SubjectUpdateCreate(SQLModel):
    title: str 
    content: str 
    linked_activity_uuids: Optional[str] = Field(default=None)
    org_id: int

class SubjectUpdateRead(SQLModel):
    id: int
    title: str 
    content: str 
    subject_id: int
    subjectupdate_uuid: str
    linked_activity_uuids: Optional[str] = Field(default=None)
    org_id: int
    creation_date: str
    update_date: str

class SubjectUpdateUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    linked_activity_uuids: Optional[str] = Field(default=None)

    