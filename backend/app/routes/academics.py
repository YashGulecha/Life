from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Semester, Course, Assignment
from ..schemas import SemesterResponse, SemesterCreate, CourseResponse, CourseCreate, AssignmentResponse, AssignmentCreate
from ..auth import get_current_user

router = APIRouter(prefix="/academics", tags=["Academics"])

@router.get("/semesters", response_model=List[SemesterResponse])
def get_semesters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    semesters = db.query(Semester).filter(
        Semester.user_id == current_user.id
    ).order_by(Semester.id.desc()).all()
    return semesters

@router.post("/semesters", response_model=SemesterResponse)
def create_semester(sem_in: SemesterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If this semester is active, deactivate others
    if sem_in.is_active:
        db.query(Semester).filter(
            Semester.user_id == current_user.id
        ).update({Semester.is_active: False})
        
    semester = Semester(
        user_id=current_user.id,
        name=sem_in.name,
        is_active=sem_in.is_active
    )
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester

@router.post("/courses", response_model=CourseResponse)
def create_course(semester_id: int, course_in: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    semester = db.query(Semester).filter(
        Semester.id == semester_id, 
        Semester.user_id == current_user.id
    ).first()
    if not semester:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        
    course = Course(
        semester_id=semester_id,
        name=course_in.name,
        code=course_in.code,
        target_grade=course_in.target_grade,
        current_grade=course_in.current_grade
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(course_id: int, assign_in: AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).join(Semester).filter(
        Course.id == course_id,
        Semester.user_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    assignment = Assignment(
        course_id=course_id,
        title=assign_in.title,
        weight=assign_in.weight,
        score=assign_in.score,
        due_date=assign_in.due_date,
        status=assign_in.status or "pending"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    # Recalculate course current grade if score has weight
    recalculate_course_grade(course_id, db)
    
    return assignment

@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(assignment_id: int, assign_in: AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignment = db.query(Assignment).join(Course).join(Semester).filter(
        Assignment.id == assignment_id,
        Semester.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        
    assignment.title = assign_in.title
    assignment.weight = assign_in.weight
    assignment.score = assign_in.score
    assignment.due_date = assign_in.due_date
    assignment.status = assign_in.status or assignment.status
    
    db.commit()
    db.refresh(assignment)
    
    # Recalculate course current grade
    recalculate_course_grade(assignment.course_id, db)
    
    return assignment

def recalculate_course_grade(course_id: int, db: Session):
    assignments = db.query(Assignment).filter(
        Assignment.course_id == course_id,
        Assignment.score.isnot(None),
        Assignment.weight.isnot(None)
    ).all()
    
    total_weight = sum(a.weight for a in assignments)
    if total_weight > 0:
        weighted_score = sum(a.score * a.weight for a in assignments) / total_weight
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            course.current_grade = round(weighted_score, 2)
            db.commit()
