"""Study Hub router: start a shuffled review session (with server-rotated
variants) and aggregate stats for the charts page."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.flashcard import Flashcard
from app.models.review_log import ReviewLog
from app.models.user import User
from app.schemas.study import DailyCount, StudySessionResponse, StudyStatsResponse
from app.services import fsrs_service

router = APIRouter()


@router.post("/session", response_model=StudySessionResponse)
def start_session(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cards = fsrs_service.build_session(current_user.id, db, limit=limit)
    return {"cards": cards}


def _count(db: Session, *conditions) -> int:
    return db.scalar(select(func.count()).where(*conditions)) or 0


@router.get("/stats", response_model=StudyStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    uid = current_user.id
    since_30d = now - timedelta(days=30)

    rows = db.execute(
        select(
            func.date(ReviewLog.reviewed_at).label("day"),
            func.count().label("count"),
        )
        .where(ReviewLog.user_id == uid, ReviewLog.reviewed_at >= since_30d)
        .group_by(func.date(ReviewLog.reviewed_at))
        .order_by(func.date(ReviewLog.reviewed_at))
    ).all()
    reviews_per_day = [DailyCount(date=row.day, count=row.count) for row in rows]

    def retention_rate(since: datetime) -> float:
        total = _count(db, ReviewLog.user_id == uid, ReviewLog.reviewed_at >= since)
        if total == 0:
            return 0.0
        good_or_easy = _count(
            db,
            ReviewLog.user_id == uid,
            ReviewLog.reviewed_at >= since,
            ReviewLog.rating.in_([3, 4]),
        )
        return round(good_or_easy / total * 100, 1)

    due_count = _count(db, Flashcard.user_id == uid, Flashcard.due <= now)

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    reviewed_today = _count(db, ReviewLog.user_id == uid, ReviewLog.reviewed_at >= today_start)

    avg_difficulty = db.scalar(
        select(func.avg(Flashcard.difficulty)).where(Flashcard.user_id == uid)
    ) or 0.0

    # Consecutive days (including today) with >=1 review.
    streak = 0
    day_cursor = today_start
    while True:
        day_end = day_cursor + timedelta(days=1)
        count = _count(
            db,
            ReviewLog.user_id == uid,
            ReviewLog.reviewed_at >= day_cursor,
            ReviewLog.reviewed_at < day_end,
        )
        if count == 0:
            break
        streak += 1
        day_cursor -= timedelta(days=1)

    return StudyStatsResponse(
        reviews_per_day=reviews_per_day,
        retention_rate_7d=retention_rate(now - timedelta(days=7)),
        retention_rate_30d=retention_rate(since_30d),
        due_count=due_count,
        reviewed_today=reviewed_today,
        streak_days=streak,
        avg_difficulty=round(avg_difficulty, 2),
    )
