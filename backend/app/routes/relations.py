from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from ..database import get_db
from ..models import User, Relationship, RelationshipLog
from ..schemas import RelationshipResponse, RelationshipCreate, RelationshipLogResponse, RelationshipLogCreate
from ..auth import get_current_user

router = APIRouter(prefix="/relations", tags=["Relationship CRM"])

@router.get("", response_model=List[RelationshipResponse])
def get_relationships(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    relations = db.query(Relationship).filter(
        Relationship.user_id == current_user.id
    ).all()
    
    # Sort relations so those past their contact threshold appear first (urgent contacts)
    def sort_key(r):
        if not r.last_contact_date:
            return -999999 # Most urgent
        days_since = (date.today() - r.last_contact_date).days
        overdue_margin = days_since - r.contact_interval_days
        return -overdue_margin # More positive means more overdue, sorting desc by negative places highest urgency first
        
    relations.sort(key=sort_key)
    return relations

@router.post("", response_model=RelationshipResponse)
def create_relationship(rel_in: RelationshipCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    relation = Relationship(
        user_id=current_user.id,
        name=rel_in.name,
        relationship_type=rel_in.relationship_type,
        contact_interval_days=rel_in.contact_interval_days or 14,
        last_contact_date=date.today() # Initialized to today on creation
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return relation

@router.post("/{relationship_id}/log", response_model=RelationshipLogResponse)
def log_contact(relationship_id: int, log_in: RelationshipLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    relation = db.query(Relationship).filter(
        Relationship.id == relationship_id,
        Relationship.user_id == current_user.id
    ).first()
    if not relation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
        
    log = RelationshipLog(
        relationship_id=relationship_id,
        log_date=log_in.log_date,
        notes=log_in.notes
    )
    db.add(log)
    
    # Update last contact date if this log is newer than the stored one
    if not relation.last_contact_date or log_in.log_date > relation.last_contact_date:
        relation.last_contact_date = log_in.log_date
        
    db.commit()
    db.refresh(log)
    return log
