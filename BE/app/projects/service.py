from app.models import (
    Project,
    ProjectType,
    Form,
    FormTemplate,
    ProjectWorkflowStep,
    WorkflowStep,
)
from app.models import DBSession
from app.schemas import ProjectCreate, WorkflowStepPublic


async def create(
    *,
    client_id: int,
    project_data: ProjectCreate,
    db: DBSession,
) -> Project:
    try:
        new_project = Project(
            client_id=client_id,
            type_id=project_data.type_id,
            beneficiary_first_name=project_data.beneficiary_first_name,
            beneficiary_last_name=project_data.beneficiary_last_name,
            position_title=project_data.position_title,
            filing_type=project_data.filing_type,
            deadline=project_data.deadline,
            priority=project_data.priority,
            premium_processing=project_data.premium_processing,
            notes=project_data.notes,
        )
        db.add(new_project)
        db.flush()

        # For now, only support FBG projects
        project_type = db.query(ProjectType).get(project_data.type_id)
        if project_type and project_type.name == "Family-Based Green Card":
            # add I-130 form
            i130_template = (
                db.query(FormTemplate).filter(FormTemplate.name == "I-130").first()
            )
            if not i130_template:
                raise ValueError("I-130 Template not found")
            i130_form = Form(
                project_id=new_project.id, form_template_id=i130_template.id
            )
            db.add(i130_form)
        if project_type and project_type.name == "H-1B Specialty Occupation":
            # add I-129 form
            i129_template = (
                db.query(FormTemplate).filter(FormTemplate.name == "I-129").first()
            )
            if not i129_template:
                raise ValueError("I-129 Template not found")
            i129_form = Form(
                project_id=new_project.id, form_template_id=i129_template.id
            )
            db.add(i129_form)

        db.commit()
        db.refresh(new_project)
        return new_project

    except Exception:
        db.rollback()
        raise


async def delete(*, db: DBSession, project: Project) -> dict:
    try:
        db.delete(project)
        db.commit()
        return {"message": "Project deleted successfully"}
    except Exception:
        db.rollback()
        raise


async def list_types(*, db: DBSession) -> list[ProjectType]:
    return db.query(ProjectType).order_by(ProjectType.sequence).all()


async def list_workflow_steps(
    *, db: DBSession, project_id: int
) -> list[WorkflowStepPublic]:
    """List workflow steps for a project type, nested one level deep"""

    project_type_id = (
        db.query(Project.type_id).filter(Project.id == project_id).scalar()
    )

    # Left join all steps for this type with any matching project_workflow_step for this project
    rows: list[tuple[WorkflowStep, ProjectWorkflowStep | None]] = (
        db.query(WorkflowStep, ProjectWorkflowStep)
        .outerjoin(
            ProjectWorkflowStep,
            (
                (ProjectWorkflowStep.workflow_step_id == WorkflowStep.id)
                & (ProjectWorkflowStep.project_id == project_id)
            ),
        )
        .filter(WorkflowStep.project_type_id == project_type_id)
        .order_by(WorkflowStep.sequence)
        .all()
    )

    # Group children by parent
    children_by_parent: dict[
        int, list[tuple[WorkflowStep, ProjectWorkflowStep | None]]
    ] = {}
    for step, pws in rows:
        if step.parent_step_id is not None:
            children_by_parent.setdefault(step.parent_step_id, []).append((step, pws))

    # Build one-level deep tree of pydantic models
    top_level_rows = [(s, pws) for (s, pws) in rows if s.parent_step_id is None]

    result: list[WorkflowStepPublic] = []
    for top, top_pws in top_level_rows:
        child_models = [
            WorkflowStepPublic(
                id=child.id,
                name=child.name,
                description=child.description,
                key=child.key,
                sequence=child.sequence,
                started_at=(pws.started_at if pws else None),
                completed_at=(pws.completed_at if pws else None),
                child_steps=None,
            )
            for (child, pws) in children_by_parent.get(top.id, [])
        ]

        result.append(
            WorkflowStepPublic(
                id=top.id,
                name=top.name,
                description=top.description,
                key=top.key,
                sequence=top.sequence,
                started_at=(top_pws.started_at if top_pws else None),
                completed_at=(top_pws.completed_at if top_pws else None),
                child_steps=child_models if child_models else None,
            )
        )

    return result
