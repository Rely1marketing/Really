from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class GenerateRequest(BaseModel):
    goal: str

class SMSVariant(BaseModel):
    variant: str
    text: str

class GenerateResponse(BaseModel):
    variants: List[SMSVariant]

class SendRequest(BaseModel):
    campaign_id: int
    variant: str  # A, B or auto
    contacts: List[int]
    schedule_at: Optional[datetime] = None

class DashboardMetrics(BaseModel):
    messages_last_7_days: int
    ctr: float
    opt_outs: int
