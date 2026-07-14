from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Dict, Any
from ..database import get_db
from ..models import User, FinancialLog, NetWorth
from ..schemas import FinancialLogResponse, FinancialLogCreate, NetWorthResponse, NetWorthCreate
from ..auth import get_current_user

router = APIRouter(prefix="/finances", tags=["Finances"])

@router.get("/logs", response_model=List[FinancialLogResponse])
def get_financial_logs(limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(FinancialLog).filter(
        FinancialLog.user_id == current_user.id
    ).order_by(FinancialLog.logged_at.desc()).limit(limit).all()
    return logs

@router.post("/log", response_model=FinancialLogResponse)
def log_transaction(log_in: FinancialLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = FinancialLog(
        user_id=current_user.id,
        amount=log_in.amount,
        transaction_type=log_in.transaction_type,
        category=log_in.category,
        description=log_in.description,
        logged_at=log_in.logged_at or func.now()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/net-worth", response_model=List[NetWorthResponse])
def get_net_worth_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(NetWorth).filter(
        NetWorth.user_id == current_user.id
    ).order_by(NetWorth.recorded_at.asc()).all()
    return records

@router.post("/net-worth", response_model=NetWorthResponse)
def record_net_worth(nw_in: NetWorthCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(NetWorth).filter(
        NetWorth.user_id == current_user.id,
        NetWorth.recorded_at == nw_in.recorded_at
    ).first()
    
    if record:
        record.assets = nw_in.assets
        record.liabilities = nw_in.liabilities
    else:
        record = NetWorth(
            user_id=current_user.id,
            assets=nw_in.assets,
            liabilities=nw_in.liabilities,
            recorded_at=nw_in.recorded_at
        )
        db.add(record)
        
    db.commit()
    db.refresh(record)
    return record

@router.get("/summary")
def get_finance_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate monthly income vs expense
    start_of_month = date.today().replace(day=1)
    
    logs = db.query(FinancialLog).filter(
        FinancialLog.user_id == current_user.id,
        FinancialLog.logged_at >= start_of_month
    ).all()
    
    income = sum(l.amount for l in logs if l.transaction_type == "income")
    expense = sum(l.amount for l in logs if l.transaction_type == "expense")
    
    # Calculate expenses by category
    categories = {}
    for l in logs:
        if l.transaction_type == "expense":
            categories[l.category] = categories.get(l.category, 0.0) + l.amount
            
    # Get latest net worth snapshot
    latest_nw = db.query(NetWorth).filter(
        NetWorth.user_id == current_user.id
    ).order_by(NetWorth.recorded_at.desc()).first()
    
    net_worth_val = 0.0
    if latest_nw:
        net_worth_val = latest_nw.assets - latest_nw.liabilities
        
    return {
        "monthly_income": income,
        "monthly_expense": expense,
        "net_savings": income - expense,
        "expense_by_category": categories,
        "latest_net_worth": net_worth_val,
        "latest_net_worth_details": latest_nw
    }
