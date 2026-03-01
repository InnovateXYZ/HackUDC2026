from sqlmodel import Session, select
from .models import User
from .schemas import UserCreate, UserUpdate
from .utils import hash_password, verify_password


def get_user_by_username(session: Session, username: str) -> User | None:
    return session.exec(select(User).where(User.username == username)).first()


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email)).first()


def create_user(session: Session, user_create: UserCreate) -> User:
    hashed = hash_password(user_create.password)
    user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed,
        gender_identity=user_create.gender_identity,
        name=user_create.name,
        date_of_birth=user_create.date_of_birth,
        user_preferences=user_create.user_preferences,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, identifier: str, password: str) -> User | None:
    user = get_user_by_username(session, identifier) or get_user_by_email(
        session, identifier
    )
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(session: Session, user: User, updates: UserUpdate) -> User:
    """Apply partial updates to an existing user and persist them."""
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_user_profile_image(session: Session, user: User, image_path: str) -> User:
    """Update the user's profile image path."""
    user.profile_image = image_path
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
