import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .database import Base

class UIModeEnum(str, enum.Enum):
    TECH_STRICT = "TECH_STRICT"
    NORMAL_MASK = "NORMAL_MASK"

class ProviderEnum(str, enum.Enum):
    OPENAI = "OPENAI"
    GEMINI = "GEMINI"
    ANTHROPIC = "ANTHROPIC"
    OLLAMA_LOCAL = "OLLAMA_LOCAL"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    ui_mode = Column(Enum(UIModeEnum), default=UIModeEnum.NORMAL_MASK, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    models = relationship("ConnectedModel", back_populates="owner")

class ConnectedModel(Base):
    __tablename__ = "connected_models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_name = Column(Enum(ProviderEnum), nullable=False)
    encrypted_api_key = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="models")