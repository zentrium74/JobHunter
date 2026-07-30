from sqlalchemy import create_engine, Column, String, Boolean, Integer, JSON
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./jobhunter.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 15.0})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBJobListing(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String)
    remote = Column(Boolean, default=True)
    salary_range = Column(String)
    description = Column(String)
    skills_required = Column(JSON)
    posted_date = Column(String)
    match_score = Column(Integer, nullable=True)
    status = Column(String, default="Discovered")
    source_name = Column(String)

class DBCandidateProfile(Base):
    __tablename__ = "profile"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    target_title = Column(String)
    skills = Column(JSON)
    experience_years = Column(Integer)
    target_salary_min = Column(Integer)
    target_salary_max = Column(Integer)
    location_preference = Column(String)
    bio = Column(String)
    has_completed_onboarding = Column(Boolean, default=False)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
