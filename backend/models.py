from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    opted_out = Column(Boolean, default=False)

    messages = relationship("MessageLog", back_populates="contact")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    goal = Column(String, nullable=False)
    message_a = Column(String, nullable=False)
    message_b = Column(String, nullable=False)
    chosen_variant = Column(String, default="auto")  # A, B or auto
    scheduled_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("MessageLog", back_populates="campaign")

class MessageLog(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    variant = Column(String)  # A or B
    body = Column(String)
    send_at = Column(DateTime, default=datetime.utcnow)
    clicks = Column(Integer, default=0)
    code = Column(String, unique=True, index=True)  # for click tracking

    campaign = relationship("Campaign", back_populates="messages")
    contact = relationship("Contact", back_populates="messages")
