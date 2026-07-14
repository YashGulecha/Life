from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- HEALTH SCHEMAS ---
class HealthLogCreate(BaseModel):
    log_date: date
    weight: Optional[float] = None
    water_intake: Optional[int] = 0
    sleep_duration: Optional[float] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class HealthLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    weight: Optional[float]
    water_intake: int
    sleep_duration: Optional[float]
    energy_level: Optional[int]
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HabitCreate(BaseModel):
    name: str
    category: Optional[str] = None

class HabitLogCreate(BaseModel):
    log_date: date
    status: bool

class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    log_date: date
    status: bool
    model_config = ConfigDict(from_attributes=True)

class HabitResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    created_at: datetime
    logs: List[HabitLogResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- ACADEMICS SCHEMAS ---
class AssignmentCreate(BaseModel):
    title: str
    weight: Optional[float] = None # e.g. 0.2
    score: Optional[float] = None # e.g. 95.0
    due_date: Optional[datetime] = None
    status: Optional[str] = "pending"

class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    weight: Optional[float]
    score: Optional[float]
    due_date: Optional[datetime]
    status: str
    model_config = ConfigDict(from_attributes=True)

class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None
    target_grade: Optional[float] = None
    current_grade: Optional[float] = None

class CourseResponse(BaseModel):
    id: int
    semester_id: int
    name: str
    code: Optional[str]
    target_grade: Optional[float]
    current_grade: Optional[float]
    assignments: List[AssignmentResponse] = []
    model_config = ConfigDict(from_attributes=True)

class SemesterCreate(BaseModel):
    name: str
    is_active: Optional[bool] = True

class SemesterResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    courses: List[CourseResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- FINANCES SCHEMAS ---
class NetWorthCreate(BaseModel):
    assets: float
    liabilities: float
    recorded_at: date

class NetWorthResponse(BaseModel):
    id: int
    assets: float
    liabilities: float
    recorded_at: date
    model_config = ConfigDict(from_attributes=True)

class FinancialLogCreate(BaseModel):
    amount: float
    transaction_type: str # income, expense
    category: str
    description: Optional[str] = None
    logged_at: Optional[datetime] = None

class FinancialLogResponse(BaseModel):
    id: int
    amount: float
    transaction_type: str
    category: str
    description: Optional[str]
    logged_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- CRM RELATIONSHIP SCHEMAS ---
class RelationshipLogCreate(BaseModel):
    log_date: date
    notes: Optional[str] = None

class RelationshipLogResponse(BaseModel):
    id: int
    relationship_id: int
    log_date: date
    notes: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class RelationshipCreate(BaseModel):
    name: str
    relationship_type: Optional[str] = None
    contact_interval_days: Optional[int] = 14

class RelationshipResponse(BaseModel):
    id: int
    name: str
    relationship_type: Optional[str]
    contact_interval_days: int
    last_contact_date: Optional[date]
    logs: List[RelationshipLogResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- NOTES SCHEMAS ---
class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- COMMAND ROUTER SCHEMAS ---
class CommandRequest(BaseModel):
    command: str

class CommandResponse(BaseModel):
    success: bool
    message: str
    action_type: str # todo, finance, health, note, relation, unknown
    data: Optional[dict] = None
