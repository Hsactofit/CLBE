from sqlalchemy.orm import Session
from models import (
    FormFieldResponse,
    FormTemplateField,
    FormTemplate,
    FormTemplateFieldTypes,
    Form,
    Project,
    ProjectType,
    Client,
    User,
)
from database import SessionLocal


def create_dummy_data():
    """
    创建测试用的 dummy 数据
    """
    db = SessionLocal()
    try:
        # 1. 创建 Client
        client = Client(name="Test Client Company")
        db.add(client)
        db.flush()  # 获取 client.id

        # 2. 创建 User
        user = User(public_id="user_test_123456", client_id=client.id)
        db.add(user)
        db.flush()

        # 提交所有创建的基础数据
        db.commit()

        return {
            "client": client,
            "user": user,
        }

    except Exception as e:
        db.rollback()
        print(f"创建 dummy 数据失败: {e}")
        raise
    finally:
        db.close()


def create_form_field_response_with_dummy_data(field_responses):
    """
    创建完整的表单响应，包括必要的关联数据
    Args:
        field_responses (list): 字段响应数据列表
            例如: [
                {'field_name': 'Petitioner.FirstName', 'value': 'John'},
                {'field_name': 'Petitioner.LastName', 'value': 'Doe'},
            ]
    """
    db = SessionLocal()
    try:
        # 1. 检查是否已有测试数据，如果没有则创建
        client = db.query(Client).first()
        if not client:
            print("没有找到现有数据，正在创建 dummy 数据...")
            dummy_data = create_dummy_data()
            # 重新获取数据库会话
            db.close()
            db = SessionLocal()
            client = db.query(Client).first()
            form_template = db.query(FormTemplate).first()
        else:
            form_template = db.query(FormTemplate).first()
            if not form_template:
                print("客户端存在但表单模板不存在，请先创建表单模板")
                return None

        # 2. 创建 Project
        project = Project(client_id=client.id, type=ProjectType.FAMILY_BASED_GREENCARD)
        db.add(project)
        db.flush()

        # 3. 创建 Form
        form = Form(form_template_id=form_template.id, project_id=project.id)
        db.add(form)
        db.flush()

        # 4. 创建 FormFieldResponse
        responses = []
        for field_data in field_responses:
            # 根据字段名查找对应的 FormTemplateField
            template_field = (
                db.query(FormTemplateField)
                .filter(FormTemplateField.key == field_data["field_name"])
                .first()
            )

            if template_field:
                response = FormFieldResponse(
                    form_id=form.id,
                    form_template_field_id=template_field.id,
                    value=field_data["value"],
                )
                responses.append(response)
                db.add(response)
            else:
                print(f"警告: 找不到字段 '{field_data['field_name']}'")

        # 5. 提交所有更改
        db.commit()

        # 6. 刷新对象
        db.refresh(project)
        db.refresh(form)
        for response in responses:
            db.refresh(response)

        result = {
            "client_id": client.id,
            "project_id": project.id,
            "form_id": form.id,
            "form_template_id": form_template.id,
            "response_ids": [r.id for r in responses],
            "responses_count": len(responses),
        }

        print(f"成功创建完整记录: {result}")
        return result

    except Exception as e:
        db.rollback()
        print(f"创建记录失败: {e}")
        raise
    finally:
        db.close()


def check_existing_data():
    """
    检查现有数据
    """
    db = SessionLocal()
    try:
        clients = db.query(Client).all()
        form_templates = db.query(FormTemplate).all()
        projects = db.query(Project).all()
        forms = db.query(Form).all()

        print(f"现有数据统计:")
        print(f"- Clients: {len(clients)}")
        print(f"- Form Templates: {len(form_templates)}")
        print(f"- Projects: {len(projects)}")
        print(f"- Forms: {len(forms)}")

        if clients:
            print("\n客户端列表:")
            for client in clients:
                print(f"  - ID: {client.id}, Name: {client.name}")

        if form_templates:
            print("\n表单模板列表:")
            for template in form_templates:
                print(f"  - ID: {template.id}, Name: {template.name}")

    finally:
        db.close()


# 使用示例
if __name__ == "__main__":
    # 1. 先检查现有数据
    print("=== 检查现有数据 ===")
    check_existing_data()

    print("\n=== 创建测试响应 ===")
    # 2. 创建测试数据
    field_responses = [
        {"field_name": "Petitioner.PastAddresses", "value": "2"},
        {
            "field_name": "Petitioner.PhysicalAddress1.Address.StreetNumberName",
            "value": "True",
        },
        {"field_name": "Petitioner.HasOtherName", "value": "False"},
        {
            "field_name": "Petitioner.MailingAddress.SameAsPhysicalAddress",
            "value": "False",
        },
    ]

    result = create_form_field_response_with_dummy_data(field_responses)

    print("\n=== 最终数据统计 ===")
    check_existing_data()
