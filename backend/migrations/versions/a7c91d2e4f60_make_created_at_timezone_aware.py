
"""Make users.created_at timezone-aware.

Revision ID: a7c91d2e4f60
Revises: 85c18a8f644a
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7c91d2e4f60"
down_revision: Union[str, Sequence[str], None] = "85c18a8f644a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
