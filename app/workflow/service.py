from sqlalchemy.orm import Session as DBSession
from app.models import (
    Project,
    ProjectWorkflowStep,
    WorkflowStep,
    FormFieldResponse,
    Form,
    FormTemplateSection,
    Document,
    ProjectType,
)
from app.schemas import WorkflowStepPublic
from datetime import datetime
from typing import Optional, List
import logging

logger = logging.getLogger("uvicorn.error")


async def get_workflow_steps(*, db: DBSession, project: Project) -> List[WorkflowStepPublic]:
    """Get all workflow steps for a project"""
    project_workflow_steps = (
        db.query(ProjectWorkflowStep)
        .join(WorkflowStep)
        .filter(ProjectWorkflowStep.project_id == project.id)
        .order_by(WorkflowStep.sequence)
        .all()
    )

    return [
        WorkflowStepPublic(
            step_key=pws.workflow_step.key,
            completed=pws.completed_at is not None,
            completed_at=pws.completed_at,
        )
        for pws in project_workflow_steps
    ]


async def complete_workflow_step(
    *, db: DBSession, project: Project, workflow_step_key: str
) -> list[WorkflowStepPublic]:
    return await complete_workflow_steps(
        db=db, project=project, workflow_step_keys=[workflow_step_key]
    )


async def complete_workflow_steps(
    *, db: DBSession, project: Project, workflow_step_keys: list[str]
) -> list[WorkflowStepPublic]:
    """Complete a workflow step"""
    now = datetime.datetime.now(datetime.timezone.utc)

    workflow_steps = (
        db.query(WorkflowStep).filter(
            WorkflowStep.key.in_(workflow_step_keys)).all()
    )

    if not workflow_steps:
        raise ValueError(
            f"No workflow steps found with keys {workflow_step_keys}")

    if len(workflow_steps) != len(workflow_step_keys):
        found_keys = [step.key for step in workflow_steps]
        missing_keys = set(workflow_step_keys) - set(found_keys)
        raise ValueError(f"Missing workflow steps with keys: {missing_keys}")

    for workflow_step in workflow_steps:
        project_workflow_step = (
            db.query(ProjectWorkflowStep)
            .filter(
                ProjectWorkflowStep.workflow_step_id == workflow_step.id,
                ProjectWorkflowStep.project_id == project.id,
            )
            .first()
        )

        if project_workflow_step:
            if project_workflow_step.completed_at:
                project_workflow_step.updated_at = now
            else:
                project_workflow_step.completed_at = now
        else:
            project_workflow_step = ProjectWorkflowStep(
                project_id=project.id,
                workflow_step_id=workflow_step.id,
                started_at=now,
                completed_at=now,
            )
            db.add(project_workflow_step)

    db.commit()
    return await list_workflow_steps(db=db, project=project)


async def evaluate_workflow_steps(
    *,
    db: DBSession,
    project: Project,
    step_key: Optional[str] = None
) -> List[WorkflowStepPublic]:
    """
    Evaluate project workflow steps and update completion status.

    Args:
        db: Database session
        project: Project to evaluate
        step_key: Optional specific step to evaluate. If None, evaluates all incomplete steps.

    Returns:
        Updated list of workflow steps
    """
    logger.info(
        f"Evaluating workflow steps for project {project.id}, step_key: {step_key}")

    # Get current project workflow steps
    project_workflow_steps = (
        db.query(ProjectWorkflowStep)
        .join(WorkflowStep)
        .filter(ProjectWorkflowStep.project_id == project.id)
        .all()
    )

    # Create lookup by step key
    pws_by_key = {pws.workflow_step.key: pws for pws in project_workflow_steps}

    # Determine which steps to evaluate
    if step_key:
        # Evaluate specific step only
        steps_to_evaluate = [step_key] if step_key in pws_by_key else []
    else:
        # Evaluate only incomplete steps
        steps_to_evaluate = [
            pws.workflow_step.key for pws in project_workflow_steps
            if pws.completed_at is None
        ]

    # Evaluate each step based on project type
    project_type = db.query(ProjectType).filter(
        ProjectType.id == project.type_id).first()
    if project_type and project_type.name == "H1B":
        await _evaluate_h1b_workflow_steps(db, project, steps_to_evaluate, pws_by_key)
    else:
        logger.warning(
            f"Unknown or unsupported project type: {project_type.name if project_type else 'None'}")

    # Return refreshed workflow steps
    return await get_workflow_steps(db=db, project=project)


async def _evaluate_h1b_workflow_steps(
    db: DBSession,
    project: Project,
    steps_to_evaluate: List[str],
    pws_by_key: dict
):
    """Evaluate H1B workflow steps and update completion status"""

    for step_key in steps_to_evaluate:
        if step_key not in pws_by_key:
            logger.warning(
                f"Step key '{step_key}' not found for project {project.id}")
            continue

        is_complete = False

        if step_key == "document_gathering":
            is_complete = await _evaluate_document_gathering_step(db, project)

        elif step_key == "information_collection":
            is_complete = await _evaluate_information_collection_step(db, project)

        elif step_key == "form_review":
            is_complete = await _evaluate_form_review_step(db, project)

        elif step_key == "submission":
            is_complete = await _evaluate_submission_step(db, project)

        else:
            logger.warning(f"Unknown H1B workflow step: {step_key}")
            continue

        # Update completion status if step is now complete
        project_workflow_step = pws_by_key[step_key]
        if is_complete and project_workflow_step.completed_at is None:
            project_workflow_step.completed_at = datetime.utcnow()
            db.add(project_workflow_step)
            logger.info(
                f"Marked step '{step_key}' as complete for project {project.id}")

    db.commit()


async def _evaluate_document_gathering_step(db: DBSession, project: Project) -> bool:
    """
    Evaluate if document gathering step is complete.

    For H1B, required documents might include:
    - Passport
    - Educational certificates
    - Employment letter
    - etc.
    """
    # Get all documents for this project
    documents = (
        db.query(Document)
        .filter(Document.project_id == project.id)
        .all()
    )

    # Define required document types for H1B (this would be configurable in real implementation)
    required_document_types = [
        "passport",
        "educational_certificate",
        "employment_letter",
        "resume"
    ]

    # Check if all required documents are uploaded
    # Using inferred_type relationship to get document type codes
    uploaded_types = set()
    for doc in documents:
        if doc.inferred_type and doc.inferred_type.code:
            uploaded_types.add(doc.inferred_type.code)

    missing_types = set(required_document_types) - uploaded_types

    is_complete = len(missing_types) == 0

    if not is_complete:
        logger.info(f"Document gathering incomplete. Missing: {missing_types}")

    return is_complete


async def _evaluate_information_collection_step(db: DBSession, project: Project) -> bool:
    """
    Evaluate if information collection step is complete.

    Checks if all required form sections have been completed.
    """
    # Get all forms for this project
    forms = (
        db.query(Form)
        .filter(Form.project_id == project.id)
        .all()
    )

    if not forms:
        return False

    for form in forms:
        # Get all sections for this form template
        sections = form.form_template.sections

        for section in sections:
            # Get all required fields for this section
            required_fields = [
                field for field in section.fields
                if not field.optional
            ]

            if not required_fields:
                continue

            # Check if all required fields have responses
            responses = (
                db.query(FormFieldResponse)
                .filter(
                    FormFieldResponse.form_id == form.id,
                    FormFieldResponse.form_template_field_id.in_(
                        [f.id for f in required_fields])
                )
                .all()
            )

            # Check if we have responses for all required fields
            responded_field_ids = {
                r.form_template_field_id for r in responses if r.value}
            required_field_ids = {f.id for f in required_fields}

            if not required_field_ids.issubset(responded_field_ids):
                missing_fields = required_field_ids - responded_field_ids
                logger.info(
                    f"Information collection incomplete. Missing responses for field IDs: {missing_fields}")
                return False

    return True


async def _evaluate_form_review_step(db: DBSession, project: Project) -> bool:
    """
    Evaluate if form review step is complete.

    This might check:
    - All forms have been reviewed
    - Review comments addressed
    - Final approval given
    """
    # For now, assume review is complete if information collection is complete
    # In real implementation, this might check for review flags, approvals, etc.

    forms = (
        db.query(Form)
        .filter(Form.project_id == project.id)
        .all()
    )

    # Check if all forms are marked as completed/reviewed
    for form in forms:
        if not form.completed:  # Using the completed field from Form model
            logger.info(
                f"Form review incomplete. Form {form.id} not marked as reviewed")
            return False

    return True


async def _evaluate_submission_step(db: DBSession, project: Project) -> bool:
    """
    Evaluate if submission step is complete.

    This might check:
    - Final documents generated
    - Submission confirmed
    - Payment processed
    """
    # For now, assume submission is complete if all previous steps are complete
    # In real implementation, this might check for submission confirmations, payments, etc.

    # Get current project workflow steps
    project_workflow_steps = (
        db.query(ProjectWorkflowStep)
        .join(WorkflowStep)
        .filter(ProjectWorkflowStep.project_id == project.id)
        .all()
    )

    required_previous_steps = ["document_gathering",
                               "information_collection", "form_review"]

    for step_key in required_previous_steps:
        pws = next(
            (pws for pws in project_workflow_steps if pws.workflow_step.key == step_key), None)
        if not pws or pws.completed_at is None:
            logger.info(
                f"Submission incomplete. Previous step '{step_key}' not complete")
            return False

    return True


# Integration function for forms service
async def evaluate_after_form_submission(
    db: DBSession,
    project: Project,
    form: Form,
    section: FormTemplateSection
) -> List[WorkflowStepPublic]:
    """
    Evaluate workflow after a form section submission.

    This should be called from submit_section_responses after successful submission.
    """
    logger.info(
        f"Evaluating workflow after form submission: project {project.id}, form {form.id}, section {section.id}")

    # Evaluate the information collection step specifically
    return await evaluate_workflow_steps(
        db=db,
        project=project,
        step_key="information_collection"
    )
