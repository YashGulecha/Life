from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    totp_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    health_logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    semesters = relationship("Semester", back_populates="user", cascade="all, delete-orphan")
    net_worth_records = relationship("NetWorth", back_populates="user", cascade="all, delete-orphan")
    financial_logs = relationship("FinancialLog", back_populates="user", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")

class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    weight = Column(Float, nullable=True)
    water_intake = Column(Integer, default=0) # Glasses/ml
    sleep_duration = Column(Float, nullable=True) # Hours
    energy_level = Column(Integer, nullable=True) # 1 to 5
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_user_health_date"),)

    user = relationship("User", back_populates="health_logs")

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True) # Physical, Academic, Mindful, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    status = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint("habit_id", "log_date", name="uq_habit_log_date"),)

    habit = relationship("Habit", back_populates="logs")

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False) # e.g. "Fall 2026"
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="semesters")
    courses = relationship("Course", back_populates="semester", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    target_grade = Column(Float, nullable=True)
    current_grade = Column(Float, nullable=True)

    semester = relationship("Semester", back_populates="courses")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    weight = Column(Float, nullable=True) # e.g. 0.25 (25%)
    score = Column(Float, nullable=True) # e.g. 92.5
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending") # pending, completed, overdue

    course = relationship("Course", back_populates="assignments")

class NetWorth(Base):
    __tablename__ = "net_worth"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assets = Column(Float, nullable=False)
    liabilities = Column(Float, nullable=False)
    recorded_at = Column(Date, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "recorded_at", name="uq_user_networth_date"),)

    user = relationship("User", back_populates="net_worth_records")

class FinancialLog(Base):
    __tablename__ = "financial_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False) # income, expense
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="financial_logs")

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    relationship_type = Column(String, nullable=True) # Family, Friend, Mentor, Professional
    contact_interval_days = Column(Integer, default=14)
    last_contact_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="relationships")
    logs = relationship("RelationshipLog", back_populates="relationship", cascade="all, delete-orphan")

class RelationshipLog(Base):
    __tablename__ = "relationship_logs"

    id = Column(Integer, primary_key=True, index=True)
    relationship_id = Column(Integer, ForeignKey("relationships.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)

    relationship = relationship("Relationship", back_populates="logs")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "title", name="uq_user_note_title"),)

    user = relationship("User", back_populates="notes")
