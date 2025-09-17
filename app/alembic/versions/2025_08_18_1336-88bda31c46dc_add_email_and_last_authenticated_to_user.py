"""add_email_and_last_authenticated_to_user

Revision ID: 88bda31c46dc
Revises: 8bbd0c8595ab
Create Date: 2025-08-18 13:36:58.390365

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "88bda31c46dc"
down_revision: Union[str, Sequence[str], None] = "8bbd0c8595ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add email column to user table
    op.add_column("user", sa.Column("email", sa.String(255), nullable=True))
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=False)

    # Add last_authenticated_at column to user table
    op.add_column(
        "user",
        sa.Column("last_authenticated_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop last_authenticated_at column
    op.drop_column("user", "last_authenticated_at")

    # Drop email column and index
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_column("user", "email")
