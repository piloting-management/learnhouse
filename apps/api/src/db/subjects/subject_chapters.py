from typing import Optional
from sqlalchemy import Column, ForeignKey, Integer
from sqlmodel import Field, SQLModel


class SubjectChapter(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order: int
    subject_id: int = Field(
        sa_column=Column(Integer, ForeignKey("subject.id", ondelete="CASCADE"))
    )
    chapter_id: int = Field(
        sa_column=Column(Integer, ForeignKey("chapter.id", ondelete="CASCADE"))
    )
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    creation_date: str
    update_date: str
