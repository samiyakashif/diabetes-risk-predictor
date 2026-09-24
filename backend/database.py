from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from models import Base
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def migrate():
    """Idempotent schema migrations for an existing SQLite database."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    if "role" not in columns:
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'patient'")
            )
            conn.commit()
            print("Migrated: added 'role' column to users table")


migrate()
Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    print("Tables ready!")