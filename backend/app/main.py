from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, command, health, finances, academics, relations, notes

# Auto-initialize database tables on launch
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pulse - Life OS API",
    description="Backend API engine supporting physical telemetry, personal finances, academic logs, relations, and notes.",
    version="1.0.0"
)

# Enable CORS for frontend and native shell app bindings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allowed for local development/native app shells. Secure cookies handle authentication safety.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(command.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(finances.router, prefix="/api")
app.include_router(academics.router, prefix="/api")
app.include_router(relations.router, prefix="/api")
app.include_router(notes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Pulse Life OS Engine is running."}
