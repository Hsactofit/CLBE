from app.models import WorkflowStep
from app.models import DBSession
from app.schemas import WorkflowStepPublic


async def list_workflow_steps(
    *, db: DBSession, project_type_id: int
) -> list[WorkflowStepPublic]:
    steps: list[WorkflowStep] = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.project_type_id == project_type_id)
        .order_by(WorkflowStep.sequence)
        .all()
    )

    children_by_parent: dict[int, list[WorkflowStep]] = {}
    for step in steps:
        if step.parent_step_id is not None:
            children_by_parent.setdefault(step.parent_step_id, []).append(step)

    top_level_steps = [s for s in steps if s.parent_step_id is None]

    result: list[WorkflowStepPublic] = []
    for top in top_level_steps:
        child_models = [
            WorkflowStepPublic(
                id=child.id,
                name=child.name,
                description=child.description,
                key=child.key,
                sequence=child.sequence,
                child_steps=None,
            )
            for child in children_by_parent.get(top.id, [])
        ]

        result.append(
            WorkflowStepPublic(
                id=top.id,
                name=top.name,
                description=top.description,
                key=top.key,
                sequence=top.sequence,
                child_steps=child_models if child_models else None,
            )
        )

    return result
