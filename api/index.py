from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.database import Base, engine, get_db
from backend import schemas, crud, models
from backend.openai_utils import generate_variants
from backend.twilio_utils import send_sms
from backend.scheduler import schedule

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/campaigns/generate", response_model=schemas.GenerateResponse)
def generate_campaign(data: schemas.GenerateRequest, db: Session = Depends(get_db)):
    variants = generate_variants(data.goal)
    campaign = crud.create_campaign(db, goal=data.goal, message_a=variants[0], message_b=variants[1], chosen_variant="auto")
    return schemas.GenerateResponse(variants=[
        schemas.SMSVariant(variant="A", text=variants[0]),
        schemas.SMSVariant(variant="B", text=variants[1]),
    ])

@app.post("/campaigns/send")
def send_campaign(data: schemas.SendRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).get(data.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    contacts = crud.get_contacts(db, data.contacts)
    if not contacts:
        raise HTTPException(status_code=404, detail="No valid contacts")
    variant = data.variant if data.variant in ["A", "B"] else campaign.chosen_variant
    message_body = campaign.message_a if variant == "A" else campaign.message_b
    def _send():
        for contact in contacts:
            msg = crud.log_message(db, campaign.id, contact.id, variant, message_body)
            # Append tracking link
            url = f"https://example.com/r/{msg.code}"
            body = f"{msg.body} {url}"
            try:
                send_sms(contact.phone, body)
            except Exception:
                pass
    send_time = data.schedule_at or datetime.utcnow()
    background.add_task(schedule, send_time, _send)
    return {"status": "scheduled", "time": send_time}

@app.get("/r/{code}")
def redirect(code: str, db: Session = Depends(get_db)):
    message = crud.register_click(db, code)
    if message:
        return RedirectResponse(url="https://example.com")
    raise HTTPException(status_code=404, detail="Not found")

@app.post("/twilio/optout")
def twilio_optout(from_number: str, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter_by(phone=from_number).first()
    if contact:
        contact.opted_out = True
        db.commit()
    return {"status": "ok"}

@app.get("/dashboard", response_model=schemas.DashboardMetrics)
def dashboard(db: Session = Depends(get_db)):
    metrics = crud.count_metrics(db)
    return schemas.DashboardMetrics(**metrics)
