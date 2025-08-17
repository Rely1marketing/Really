from sqlalchemy.orm import Session
from . import models
import uuid
from datetime import datetime


def create_campaign(db: Session, goal: str, message_a: str, message_b: str, chosen_variant: str, scheduled_at=None):
    campaign = models.Campaign(
        goal=goal,
        message_a=message_a,
        message_b=message_b,
        chosen_variant=chosen_variant,
        scheduled_at=scheduled_at,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def get_contacts(db: Session, ids):
    return db.query(models.Contact).filter(models.Contact.id.in_(ids), models.Contact.opted_out == False).all()


def log_message(db: Session, campaign_id: int, contact_id: int, variant: str, body: str):
    code = uuid.uuid4().hex[:8]
    message = models.MessageLog(
        campaign_id=campaign_id,
        contact_id=contact_id,
        variant=variant,
        body=body,
        code=code,
        send_at=datetime.utcnow(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def register_click(db: Session, code: str):
    message = db.query(models.MessageLog).filter_by(code=code).first()
    if message:
        message.clicks += 1
        db.commit()
    return message


def count_metrics(db: Session):
    from datetime import timedelta
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    messages = db.query(models.MessageLog).filter(models.MessageLog.send_at >= week_ago).all()
    clicks = sum(m.clicks for m in messages)
    sent = len(messages)
    contacts_opted_out = db.query(models.Contact).filter_by(opted_out=True).count()
    ctr = (clicks / sent) * 100 if sent else 0
    return {
        "messages_last_7_days": sent,
        "ctr": round(ctr, 2),
        "opt_outs": contacts_opted_out,
    }
