"""
Workflow Evaluator Module
Evaluates and automatically completes workflow steps based on project state
"""

import logging
import datetime
from app.models import (
    DBSession,
    Project,
    WorkflowStep,
    FormTemplate,
    FormTemplateSection,
    Form,
    FormFieldResponse,
    FormTemplateField,
    Document,
    DocumentType,
    ProjectWorkflowStep,
)
from app.forms import service as form_service

logger = logging.getLogger("uvicorn.error")


async def evaluate_workflow_completion(*, db: DBSession, project: Project) -> dict:
    """
    Evaluate and complete workflow steps based on current project state.

    This function:
    1. Evaluates form section completion for H1B_INFORMATION_COLLECTION child steps
    2. Evaluates document gathering completion
    3. Marks parent steps complete if all children are complete

    Returns a dict with completed step keys
    """
    logger.info(f"Evaluating workflow completion for project {project.id}")

    completed_step_keys = []

    # Only evaluate for H-1B projects
    project_type_name = project.type.name
    if project_type_name != "H-1B Specialty Occupation":
        logger.warning(
            f"Workflow evaluation not supported for project type: {project_type_name}"
        )
        return {"completed_steps": completed_step_keys}

    # Evaluate form section completion (child steps of H1B_INFORMATION_COLLECTION)
    form_section_completions = await _evaluate_form_section_completion(
        db=db, project=project
    )
    completed_step_keys.extend(form_section_completions)

    # Evaluate document gathering completion
    document_completion = await _evaluate_document_completion(db=db, project=project)
    if document_completion:
        completed_step_keys.append(document_completion)

    # Evaluate parent step completion (must be done after child steps)
    parent_completions = await _evaluate_parent_step_completion(db=db, project=project)
    completed_step_keys.extend(parent_completions)

    # Mark all completed steps with keys in database
    if completed_step_keys:
        from app.workflow.service import complete_workflow_steps

        await complete_workflow_steps(
            db=db, project=project, workflow_step_keys=completed_step_keys
        )

    logger.info(f"Workflow evaluation complete. Completed steps: {completed_step_keys}")
    return {"completed_steps": completed_step_keys}


async def _evaluate_form_section_completion(
    *, db: DBSession, project: Project
) -> list[str]:
    """
    Evaluate completion of form sections and mark child steps complete.

    Maps form sections to workflow child steps:
    - Beneficiary_Information section -> Beneficiary Information child step
    - Employer_Information section -> Employer Information child step
    - Job_Information section -> Job Information child step

    Returns empty list since child steps don't have keys (they're handled directly)
    """
    # Get the I-129 form for this project
    form = (
        db.query(Form)
        .join(FormTemplate)
        .filter(Form.project_id == project.id, FormTemplate.name == "I-129")
        .first()
    )

    if not form:
        logger.warning(f"No I-129 form found for project {project.id}")
        return []

    # Define mapping of section names to child step names
    section_to_step_mapping = {
        "Beneficiary_Information": "Beneficiary Information",
        "Employer_Information": "Employer Information",
        "Job_Information": "Job Information",
    }

    # Get all sections for the I-129 form template
    sections = (
        db.query(FormTemplateSection)
        .filter(FormTemplateSection.form_template_id == form.form_template_id)
        .all()
    )

    # Get the parent step (H1B_INFORMATION_COLLECTION)
    parent_step = (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.key == "H1B_INFORMATION_COLLECTION",
            WorkflowStep.project_type_id == project.type_id,
        )
        .first()
    )

    if not parent_step:
        logger.warning(f"H1B_INFORMATION_COLLECTION parent step not found")
        return []

    for section in sections:
        if section.name not in section_to_step_mapping:
            continue

        # Check if this section is complete
        is_complete = await _is_section_complete(db=db, form=form, section=section)

        if is_complete:
            step_name = section_to_step_mapping[section.name]

            # Find the child step
            child_step = (
                db.query(WorkflowStep)
                .filter(
                    WorkflowStep.name == step_name,
                    WorkflowStep.parent_step_id == parent_step.id,
                )
                .first()
            )

            if child_step:
                # Complete this child step by ID
                await _complete_step_by_id(
                    db=db, project=project, step_id=child_step.id
                )
                logger.info(
                    f"Section {section.name} is complete, marked child step: {step_name}"
                )

    return []  # Child steps don't have keys, so return empty


async def _is_section_complete(
    *, db: DBSession, form: Form, section: FormTemplateSection
) -> bool:
    """
    Check if a form section is complete by verifying all required fields have responses.
    """
    # Get all required (non-optional) fields in this section and their responses
    # but ignore fields that are hidden due to dependencies
    section_fields = await form_service.get_section_fields(
        db=db,
        project=form.project,
        form_public_id=form.public_id,
        section_public_id=section.public_id,
    )
    fields = section_fields.fields

    # Check if all required fields have responses with values
    for field in fields:
        if field.optional:
            continue

        if not field.value or field.value.strip() == "":
            logger.debug(f"Field {field.key} in section {section.name} is incomplete")
            return False

    logger.info(f"Section {section.name} is complete")
    return True


async def _complete_step_by_id(
    *, db: DBSession, project: Project, step_id: int
) -> None:
    """
    Complete a workflow step by its ID (for child steps without keys).
    """
    now = datetime.datetime.now(datetime.timezone.utc)

    # Check if already completed
    existing = (
        db.query(ProjectWorkflowStep)
        .filter(
            ProjectWorkflowStep.workflow_step_id == step_id,
            ProjectWorkflowStep.project_id == project.id,
        )
        .first()
    )

    if existing:
        if not existing.completed_at:
            existing.completed_at = now
            existing.updated_at = now
            logger.info(f"Marked step ID {step_id} as complete")
    else:
        project_workflow_step = ProjectWorkflowStep(
            project_id=project.id,
            workflow_step_id=step_id,
            started_at=now,
            completed_at=now,
        )
        db.add(project_workflow_step)
        logger.info(f"Created and marked step ID {step_id} as complete")

    # Commit will be handled by the caller
    db.flush()


async def _evaluate_document_completion(
    *, db: DBSession, project: Project
) -> str | None:
    """
    Evaluate if all required documents have been uploaded.
    Returns workflow step key if complete, None otherwise.
    """
    # Get all required document types
    required_doc_types = (
        db.query(DocumentType).filter(DocumentType.required == True).all()
    )

    if not required_doc_types:
        logger.warning("No required document types found in database")
        return None

    logger.info(f"Found {len(required_doc_types)} required document types")

    # Get all documents for this project with inferred types
    uploaded_documents = (
        db.query(Document)
        .filter(Document.project_id == project.id, Document.inferred_type_id != None)
        .all()
    )

    logger.info(
        f"Project {project.id} has {len(uploaded_documents)} documents with inferred types"
    )

    # Get set of uploaded document type IDs
    uploaded_type_ids = {doc.inferred_type_id for doc in uploaded_documents}

    # Check if all required types are present
    required_type_ids = {doc_type.id for doc_type in required_doc_types}

    missing_type_ids = required_type_ids - uploaded_type_ids

    if not missing_type_ids:
        logger.info(f"All required documents uploaded for project {project.id}")
        return "H1B_DOCUMENT_GATHERING"
    else:
        # Log which document types are missing
        missing_types = (
            db.query(DocumentType).filter(DocumentType.id.in_(missing_type_ids)).all()
        )
        missing_names = [dt.name for dt in missing_types]
        logger.info(f"Project {project.id} missing required documents: {missing_names}")
        return None


async def _evaluate_parent_step_completion(
    *, db: DBSession, project: Project
) -> list[str]:
    """
    Evaluate if parent steps should be marked complete based on all children being complete.
    Returns list of parent step keys to complete.
    """
    completed_parent_keys = []

    # Get all parent steps with keys for this project type
    parent_steps = (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.project_type_id == project.type_id,
            WorkflowStep.parent_step_id == None,
            WorkflowStep.key != None,
        )
        .all()
    )

    for parent_step in parent_steps:
        # Get all child steps
        child_steps = (
            db.query(WorkflowStep)
            .filter(WorkflowStep.parent_step_id == parent_step.id)
            .all()
        )

        if not child_steps:
            # No children, skip
            continue

        logger.info(
            f"Checking parent step {parent_step.key} with {len(child_steps)} children"
        )

        # Check if all children are complete
        all_children_complete = True
        for child_step in child_steps:
            child_project_step = (
                db.query(ProjectWorkflowStep)
                .filter(
                    ProjectWorkflowStep.workflow_step_id == child_step.id,
                    ProjectWorkflowStep.project_id == project.id,
                )
                .first()
            )

            if not child_project_step or not child_project_step.completed_at:
                all_children_complete = False
                logger.debug(
                    f"Child step {child_step.name} (ID: {child_step.id}) is not complete"
                )
                break

        # If all children complete, mark parent for completion
        if all_children_complete:
            # Check if parent is already complete
            parent_project_step = (
                db.query(ProjectWorkflowStep)
                .filter(
                    ProjectWorkflowStep.workflow_step_id == parent_step.id,
                    ProjectWorkflowStep.project_id == project.id,
                )
                .first()
            )

            if not parent_project_step or not parent_project_step.completed_at:
                completed_parent_keys.append(parent_step.key)
                logger.info(
                    f"Parent step {parent_step.key} ready to be completed (all children complete)"
                )

    return completed_parent_keys
