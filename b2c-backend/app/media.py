from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import ForeignKey, Integer, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from .auth import get_current_user
from .db import Base, User, engine, get_db

MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", "/app/media"))
PROFILE_DIR = MEDIA_ROOT / "profile"
PROFILE_DIR.mkdir(parents=True, exist_ok=True)


class ProfilePhoto(Base):
    __tablename__ = "profile_photos"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    photo_url: Mapped[str] = mapped_column(String(500))


ProfilePhoto.__table__.create(bind=engine, checkfirst=True)

router = APIRouter(prefix="/api/me", tags=["profile"])

_ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_BYTES = 5 * 1024 * 1024


def serialize_user(user: User, photo_url: str | None = None):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "grade": user.grade,
        "avatar": user.avatar,
        "photo_url": photo_url,
    }


@router.get("/photo")
def get_profile_photo(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(ProfilePhoto).where(ProfilePhoto.user_id == user.id))
    return {"photo_url": row.photo_url if row else None}


@router.post("/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = _ALLOWED.get(file.content_type or "")
    if not ext:
        raise HTTPException(status_code=415, detail="JPG, PNG, WEBP 이미지만 사용할 수 있습니다.")

    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="프로필 사진은 5MB 이하로 올려 주세요.")

    current = db.scalar(select(ProfilePhoto).where(ProfilePhoto.user_id == user.id))
    old_path = None
    if current and current.photo_url.startswith("/media/profile/"):
        old_path = MEDIA_ROOT / current.photo_url.removeprefix("/media/")

    filename = f"u{user.id}-{uuid4().hex}{ext}"
    path = PROFILE_DIR / filename
    path.write_bytes(data)
    photo_url = f"/media/profile/{filename}"

    if current:
        current.photo_url = photo_url
    else:
        current = ProfilePhoto(user_id=user.id, photo_url=photo_url)
        db.add(current)
    db.commit()

    if old_path and old_path.exists() and old_path != path:
        try:
            old_path.unlink()
        except OSError:
            pass

    return {"photo_url": photo_url, "user": serialize_user(user, photo_url)}
