"""add duration estimates to workflow steps

Revision ID: 842211930fe4
Revises: 99d1c288c3bd
Create Date: 2025-10-09 03:05:16.218835

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '842211930fe4'
down_revision: Union[str, Sequence[str], None] = '99d1c288c3bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add duration columns to workflow_step table
    op.add_column('workflow_step', sa.Column(
        'estimated_duration_min', sa.Integer(), nullable=True))
    op.add_column('workflow_step', sa.Column(
        'estimated_duration_max', sa.Integer(), nullable=True))

    # Update existing H-1B workflow steps with duration estimates
    # All durations are in business days

    # Parent steps
    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 5, estimated_duration_max = 7 
        WHERE key = 'H1B_INFORMATION_COLLECTION'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 2, estimated_duration_max = 3 
        WHERE key = 'H1B_DOCUMENT_GATHERING'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 1, estimated_duration_max = 2 
        WHERE key = 'H1B_WAGE_DETERMINATION'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 7, estimated_duration_max = 10 
        WHERE key = 'H1B_DOL_LABOR_CERTIFICATION'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 3, estimated_duration_max = 5 
        WHERE key = 'H1B_PETITION_PREPARATION'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 90, estimated_duration_max = 180 
        WHERE key = 'H1B_USCIS_SUBMISSION'
    """)

    # Child steps - Information Collection
    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 1, estimated_duration_max = 2 
        WHERE name = 'Beneficiary Information'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 1, estimated_duration_max = 2 
        WHERE name = 'Employer Information'
    """)

    op.execute("""
        UPDATE workflow_step 
        SET estimated_duration_min = 1, estimated_duration_max = 2 
        WHERE name = 'Job Information'
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('workflow_step', 'estimated_duration_max')
    op.drop_column('workflow_step', 'estimated_duration_min')
