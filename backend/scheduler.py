import threading
from datetime import datetime

def schedule(send_time: datetime, func, *args, **kwargs):
    delay = (send_time - datetime.utcnow()).total_seconds()
    delay = max(delay, 0)
    timer = threading.Timer(delay, func, args=args, kwargs=kwargs)
    timer.start()
    return timer
