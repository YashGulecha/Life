from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from ..database import get_db
from ..models import User, HealthLog, Habit, HabitLog
from ..schemas import HealthLogResponse, HealthLogCreate, HabitResponse, HabitCreate, HabitLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/health", tags=["Health & Habits"])

@router.get("/logs", response_model=List[HealthLogResponse])
def get_health_logs(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start_date = date.today() - timedelta(days=days)
    logs = db.query(HealthLog).filter(
        HealthLog.user_id == current_user.id,
        HealthLog.log_date >= start_date
    ).order_by(HealthLog.log_date.desc()).all()
    return logs

@router.post("/log", response_model=HealthLogResponse)
def log_health_vitals(log_in: HealthLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(HealthLog).filter(
        HealthLog.user_id == current_user.id,
        HealthLog.log_date == log_in.log_date
    ).first()
    
    if log:
        log.weight = log_in.weight if log_in.weight is not None else log.weight
        log.water_intake = log_in.water_intake if log_in.water_intake is not None else log.water_intake
        log.sleep_duration = log_in.sleep_duration if log_in.sleep_duration is not None else log.sleep_duration
        log.energy_level = log_in.energy_level if log_in.energy_level is not None else log.energy_level
        log.notes = log_in.notes if log_in.notes is not None else log.notes
    else:
        log = HealthLog(
            user_id=current_user.id,
            log_date=log_in.log_date,
            weight=log_in.weight,
            water_intake=log_in.water_intake or 0,
            sleep_duration=log_in.sleep_duration,
            energy_level=log_in.energy_level,
            notes=log_in.notes
        )
        db.add(log)
        
    db.commit()
    db.refresh(log)
    return log

@router.get("/habits", response_model=List[HabitResponse])
def get_habits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    return habits

@router.post("/habits", response_model=HabitResponse)
def create_habit(habit_in: HabitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = Habit(
        user_id=current_user.id,
        name=habit_in.name,
        category=habit_in.category
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit

@router.post("/habits/{habit_id}/toggle", response_model=HabitLogResponse)
def toggle_habit(habit_id: int, log_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    habit_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.log_date == log_date
    ).first()
    
    if habit_log:
        habit_log.status = not habit_log.status
    else:
        habit_log = HabitLog(
            habit_id=habit_id,
            log_date=log_date,
            status=True
        )
        db.add(habit_log)
        
    db.commit()
    db.refresh(habit_log)
    return habit_log
