"""merge document table and user changes

Revision ID: 5a197358a3e3
Revises: 96777f01c3e9, fca164c7cac2
Create Date: 2025-08-19 11:25:55.105909

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5a197358a3e3"
down_revision: Union[str, Sequence[str], None] = ("96777f01c3e9", "fca164c7cac2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
