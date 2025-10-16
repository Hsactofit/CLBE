"""create project_detail table

Revision ID: 575346a5baa8
Revises: 99d1c288c3bd
Create Date: 2025-10-08 02:44:33.541897

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '575346a5baa8'
down_revision: Union[str, Sequence[str], None] = '99d1c288c3bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create project_detail table
    op.create_table(
        'project_detail',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('public_id', UUID(as_uuid=True), server_default=sa.text(
            'gen_random_uuid()'), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('project_id', 'type',
                            name='uq_project_detail_project_type')
    )

    # Create indexes
    op.create_index('idx_project_detail_project_id',
                    'project_detail', ['project_id'])
    op.create_index('idx_project_detail_public_id',
                    'project_detail', ['public_id'], unique=True)

    # Create trigger function for updated_at if it doesn't exist
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    # Create trigger for project_detail table
    op.execute("""
        CREATE TRIGGER update_project_detail_updated_at
        BEFORE UPDATE ON project_detail
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop trigger first
    op.execute(
        "DROP TRIGGER IF EXISTS update_project_detail_updated_at ON project_detail")

    # Drop indexes
    op.drop_index('idx_project_detail_public_id', table_name='project_detail')
    op.drop_index('idx_project_detail_project_id', table_name='project_detail')

    # Drop table
    op.drop_table('project_detail')

    # Note: We don't drop the update_updated_at_column() function
    # as it might be used by other tables
