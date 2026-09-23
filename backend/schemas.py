from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr

RoleLiteral = Literal["patient", "provider", "admin"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: RoleLiteral = "patient"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    role: str
    created_at: datetime