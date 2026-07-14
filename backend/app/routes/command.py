from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from ..database import get_db
from ..models import User, FinancialLog, HealthLog, Semester, Course, Assignment, Note, Relationship, RelationshipLog
from ..schemas import CommandRequest, CommandResponse
from ..auth import get_current_user
from ..services.parser import parse_command_string

router = APIRouter(prefix="/command", tags=["Command Router"])

@router.post("", response_model=CommandResponse)
def execute_command(req: CommandRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    action_type, data, message = parse_command_string(req.command)
    
    if action_type == "unknown":
        return CommandResponse(success=False, message=message, action_type=action_type)
    
    if action_type == "help":
        return CommandResponse(success=True, message=message, action_type=action_type)
        
    try:
        if action_type == "finance":
            log = FinancialLog(
                user_id=current_user.id,
                amount=data["amount"],
                transaction_type=data["transaction_type"],
                category=data["category"],
                description=data["description"]
            )
            db.add(log)
            db.commit()
            
        elif action_type == "health":
            log_date = date.today()
            health_log = db.query(HealthLog).filter(
                HealthLog.user_id == current_user.id, 
                HealthLog.log_date == log_date
            ).first()
            
            if not health_log:
                health_log = HealthLog(user_id=current_user.id, log_date=log_date)
                db.add(health_log)
                
            # Apply individual metric updates
            if "sleep_duration" in data:
                health_log.sleep_duration = data["sleep_duration"]
            if "weight" in data:
                health_log.weight = data["weight"]
            if "water_intake" in data:
                # Accumulate water intake
                health_log.water_intake = (health_log.water_intake or 0) + data["water_intake"]
            if "energy_level" in data:
                health_log.energy_level = data["energy_level"]
                
            if data.get("notes"):
                health_log.notes = (health_log.notes + "\n" + data["notes"]) if health_log.notes else data["notes"]
                
            db.commit()
            
        elif action_type == "todo":
            # Find an active semester or create a default 'General' one
            semester = db.query(Semester).filter(
                Semester.user_id == current_user.id, 
                Semester.is_active == True
            ).first()
            if not semester:
                semester = Semester(user_id=current_user.id, name="General Tasks", is_active=True)
                db.add(semester)
                db.commit()
                db.refresh(semester)
                
            # Find a default 'General' course or create it
            course = db.query(Course).filter(
                Course.semester_id == semester.id, 
                Course.name == "General Tasks"
            ).first()
            if not course:
                course = Course(semester_id=semester.id, name="General Tasks", code="GEN")
                db.add(course)
                db.commit()
                db.refresh(course)
                
            # Parse due date if specified
            due_dt = None
            if data.get("due_date"):
                try:
                    due_dt = datetime.strptime(data["due_date"], "%Y-%m-%d")
                except ValueError:
                    pass
                    
            task = Assignment(
                course_id=course.id,
                title=data["title"],
                due_date=due_dt,
                status="pending"
            )
            db.add(task)
            db.commit()
            
        elif action_type == "note":
            note = db.query(Note).filter(
                Note.user_id == current_user.id,
                Note.title == data["title"]
            ).first()
            if note:
                # If note exists, append content
                note.content = (note.content + "\n" + data["content"]) if note.content else data["content"]
                note.updated_at = datetime.utcnow()
                db.commit()
                message = f"Appended text to existing note: '{data['title']}'."
            else:
                note = Note(
                    user_id=current_user.id,
                    title=data["title"],
                    content=data["content"]
                )
                db.add(note)
                db.commit()
                
        elif action_type == "relation":
            rel = db.query(Relationship).filter(
                Relationship.user_id == current_user.id,
                Relationship.name == data["name"]
            ).first()
            if not rel:
                rel = Relationship(
                    user_id=current_user.id,
                    name=data["name"],
                    relationship_type="Friend",
                    last_contact_date=date.today()
                )
                db.add(rel)
                db.commit()
                db.refresh(rel)
            else:
                rel.last_contact_date = date.today()
                db.commit()
                
            rel_log = RelationshipLog(
                relationship_id=rel.id,
                log_date=date.today(),
                notes=data["notes"]
            )
            db.add(rel_log)
            db.commit()
            
        return CommandResponse(success=True, message=message, action_type=action_type, data=data)
        
    except Exception as e:
        db.rollback()
        return CommandResponse(success=False, message=f"Database execution error: {str(e)}", action_type=action_type)
