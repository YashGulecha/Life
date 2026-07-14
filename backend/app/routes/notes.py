from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from ..database import get_db
from ..models import User, Note
from ..schemas import NoteResponse, NoteCreate, NoteUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/notes", tags=["Notes & Wiki"])

@router.get("", response_model=List[NoteResponse])
def get_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = db.query(Note).filter(
        Note.user_id == current_user.id
    ).order_by(Note.updated_at.desc()).all()
    return notes

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

@router.post("", response_model=NoteResponse)
def create_note(note_in: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.title == note_in.title
    ).first()
    if existing:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note with this title already exists")
         
    note = Note(
        user_id=current_user.id,
        title=note_in.title,
        content=note_in.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_in: NoteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        
    if note_in.title is not None:
        # Verify title uniqueness for the user
        dup = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.title == note_in.title,
            Note.id != note_id
        ).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note with this title already exists")
        note.title = note_in.title
        
    if note_in.content is not None:
        note.content = note_in.content
        
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}
