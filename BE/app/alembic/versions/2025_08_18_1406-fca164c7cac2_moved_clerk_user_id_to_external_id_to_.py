"""moved clerk user id to external id to not expose through apis


Revision ID: fca164c7cac2
Revises: 88bda31c46dc
Create Date: 2025-08-18 14:06:35.363070

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fca164c7cac2"
down_revision: Union[str, Sequence[str], None] = "88bda31c46dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add external_id column first
    op.add_column(
        "user", sa.Column("external_id", sa.String(length=255), nullable=False)
    )

    # Copy existing Clerk user IDs from public_id to external_id
    op.execute('UPDATE "user" SET external_id = public_id WHERE external_id IS NULL')

    # Make external_id not nullable after copying data
    op.alter_column("user", "external_id", nullable=False)

    # Create index on external_id
    op.create_index(op.f("ix_user_external_id"), "user", ["external_id"], unique=True)

    # Generate new UUIDs for public_id (since it was storing Clerk user IDs)
    op.execute('UPDATE "user" SET public_id = gen_random_uuid()::text')

    # Now convert public_id to UUID type
    op.alter_column(
        "user",
        "public_id",
        existing_type=sa.VARCHAR(length=255),
        type_=sa.UUID(),
        existing_nullable=False,
        postgresql_using="public_id::uuid",
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Convert public_id back to VARCHAR
    op.alter_column(
        "user",
        "public_id",
        existing_type=sa.UUID(),
        type_=sa.VARCHAR(length=255),
        existing_nullable=False,
    )

    # Copy external_id back to public_id
    op.execute('UPDATE "user" SET public_id = external_id')

    # Drop external_id index and column
    op.drop_index(op.f("ix_user_external_id"), table_name="user")
    op.drop_column("user", "external_id")
