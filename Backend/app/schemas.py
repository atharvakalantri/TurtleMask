from pydantic import BaseModel, EmailStr
from .models import UIModeEnum, ProviderEnum

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    ui_mode: UIModeEnum

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ConnectModelRequest(BaseModel):
    user_id: str
    provider_name: ProviderEnum
    raw_api_key: str

from pydantic import BaseModel, EmailStr
from .models import UIModeEnum, ProviderEnum

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    ui_mode: UIModeEnum

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ConnectModelRequest(BaseModel):
    user_id: str
    provider_name: ProviderEnum
    raw_api_key: str

class PromptScanRequest(BaseModel):
    prompt_text: str
    ui_mode: UIModeEnum = UIModeEnum.NORMAL_MASK

from pydantic import BaseModel, EmailStr
from .models import UIModeEnum, ProviderEnum

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    ui_mode: UIModeEnum

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ConnectModelRequest(BaseModel):
    user_id: str
    provider_name: ProviderEnum
    raw_api_key: str

class PromptScanRequest(BaseModel):
    prompt_text: str
    ui_mode: UIModeEnum = UIModeEnum.NORMAL_MASK

class ChatProxyRequest(BaseModel):
    user_id: str
    provider_name: ProviderEnum
    prompt_text: str