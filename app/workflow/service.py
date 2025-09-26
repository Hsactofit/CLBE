from app.models import WorkflowStep, Project, ProjectWorkflowStep
from app.models import DBSession
from app.schemas import WorkflowStepPublic
import datetime
import logging

logger = logging.getLogger("uvicorn.error")


async def list_workflow_steps(
    *, db: DBSession, project: Project
) -> list[WorkflowStepPublic]:
    # Left join steps with any matching project_workflow_step for this project
    rows: list[tuple[WorkflowStep, ProjectWorkflowStep | None]] = (
        db.query(WorkflowStep, ProjectWorkflowStep)
        .outerjoin(
            ProjectWorkflowStep,
            (
                (ProjectWorkflowStep.workflow_step_id == WorkflowStep.id)
                & (ProjectWorkflowStep.project_id == project.id)
            ),
        )
        .filter(WorkflowStep.project_type_id == project.type_id)
        .order_by(WorkflowStep.sequence)
        .all()
    )

    # Build one-level deep tree with simple list filtering
    top_level_rows = [(s, pws) for (s, pws) in rows if s.parent_step_id is None]

    result: list[WorkflowStepPublic] = []

    for top, top_pws in top_level_rows:
        child_rows = [(s, pws) for (s, pws) in rows if s.parent_step_id == top.id]
        child_models = [
            WorkflowStepPublic(
                id=child.id,
                name=child.name,
                description=child.description,
                key=child.key,
                icon=child.icon,
                sequence=child.sequence,
                started_at=(pws.started_at if pws else None),
                completed_at=(pws.completed_at if pws else None),
                child_steps=None,
                is_active_step=False,
            )
            for (child, pws) in child_rows
        ]

        result.append(
            WorkflowStepPublic(
                id=top.id,
                name=top.name,
                description=top.description,
                key=top.key,
                icon=top.icon,
                sequence=top.sequence,
                started_at=(top_pws.started_at if top_pws else None),
                completed_at=(top_pws.completed_at if top_pws else None),
                child_steps=child_models if child_models else None,
                is_active_step=False,
            )
        )

    found_active_step = False

    # Calculate the current active step
    for step in result:
        for child_step in step.child_steps or []:
            if child_step.completed_at is None:
                child_step.is_active_step = True
                found_active_step = True
                break

        if found_active_step:
            break

        if step.completed_at is None:
            step.is_active_step = True
            found_active_step = True
            break

    return result


async def complete_workflow_step(
    *, db: DBSession, project: Project, workflow_step_id: int
) -> list[WorkflowStepPublic]:
    project_workflow_step = (
        db.query(ProjectWorkflowStep)
        .filter(
            ProjectWorkflowStep.id == workflow_step_id,
            ProjectWorkflowStep.project_id == project.id,
        )
        .first()
    )

    if project_workflow_step:
        if project_workflow_step.completed_at:
            raise ValueError("Workflow step already completed")

        project_workflow_step.completed_at = datetime.datetime.now(
            datetime.timezone.utc
        )
        db.commit()
    else:
        project_workflow_step = ProjectWorkflowStep(
            project_id=project.id,
            workflow_step_id=workflow_step_id,
            started_at=datetime.datetime.now(datetime.timezone.utc),
            completed_at=datetime.datetime.now(datetime.timezone.utc),
        )

        db.add(project_workflow_step)
        db.commit()

    return await list_workflow_steps(db=db, project=project)
