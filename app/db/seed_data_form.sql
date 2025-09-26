-- -------------------------------------------------------------
-- Seed data for USCIS Form I-129 (focused subset)
-- Maps required fields (see H1_129_data.txt) to PDF template fields
-- File: app/db/seed_data_dump.sql (primary I-129 seed)
-- -------------------------------------------------------------

-- Form template
INSERT INTO "public"."form_template" ("id", "public_id", "name", "created_at", "updated_at", "description", "status") VALUES
(1, '11111111-1111-1111-1111-111111111129', 'I-129', now(), now(), 'Petition for Nonimmigrant Worker (USCIS Form I-129). Focused seed of fields needed by app.', 'ACTIVE');

-- Sections
INSERT INTO "public"."form_template_section" ("id", "public_id", "name", "created_at", "updated_at", "description", "page_number", "form_template_id", "sequence") VALUES
(1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Beneficiary_Information', now(), now(), 'Beneficiary info fields (Part 3 and Part 4 foreign address)', NULL, 1, 1),
(2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Employer_Information',   now(), now(), 'Employer contact and counts (Part 1 and Part 5)', NULL, 1, 2),
(3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Job_Information',        now(), now(), 'Job location and off-site status (Part 5)', NULL, 1, 3);

-- Fields
-- Columns:
-- (id, created_at, updated_at, deleted_at, name, pdf_field_name, dependency_expression,
--  should_fill_on_form, type, alternative_text, description, field_metadata,
--  minimum_length, maximum_length, section_id, sequence, key, optional, css_class)

INSERT INTO "public"."form_template_field"
("id","created_at","updated_at","deleted_at","name","pdf_field_name","dependency_expression","should_fill_on_form","type","alternative_text","description","field_metadata","minimum_length","maximum_length","section_id","sequence","key","optional","css_class","sub_type")
VALUES


-- Beneficiary: Gender (radio)
(1,  now(), now(), NULL, 'Beneficiary gender', NULL, NULL, 't', 'SELECT_ONE', NULL, NULL, NULL, NULL, NULL, 1, 1, 'Beneficiary.Gender', 'f', NULL, NULL),

-- Beneficiary: SSN
(2,  now(), now(), NULL, 'Beneficiary SSN', 'Line5_SSN', NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 2, 'Beneficiary.SSN', 'f', 'limit-2', 'SSN'),

-- Beneficiary: Current U.S. residential address (Part 3)
(3,  now(), now(), NULL, 'US Street number and name', 'Line8a_StreetNumberName', NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 3, 'Beneficiary.USAddress.StreetNumberName', 'f', NULL, NULL),
(4,  now(), now(), NULL, 'US City',                   'Line8d_CityTown',        NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 4, 'Beneficiary.USAddress.City', 'f', NULL, NULL),
(5,  now(), now(), NULL, 'US State',                  'Line8e_State',           NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 5, 'Beneficiary.USAddress.State', 'f', '', 'US_STATE'),
(6,  now(), now(), NULL, 'US ZIP code',               'Line8f_ZipCode',         NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 6, 'Beneficiary.USAddress.ZIP', 'f', NULL, 'ZIP_CODE'),

-- Beneficiary: Foreign address (Part 4, D)
(7,  now(), now(), NULL, 'Foreign Street number and name', 'Line2b_StreetNumberName', '{Beneficiary.OutsideUS} == ''Yes''', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 7, 'Beneficiary.ForeignAddress.StreetNumberName', 'f', NULL, NULL),
(8,  now(), now(), NULL, 'Foreign City',                  'Line2c_CityTown',        '{Beneficiary.OutsideUS} == ''Yes''', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 8, 'Beneficiary.ForeignAddress.City', 'f', NULL, NULL),
(9,  now(), now(), NULL, 'Foreign Province/State',        'Line2g2_Province',       '{Beneficiary.OutsideUS} == ''Yes''', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 9, 'Beneficiary.ForeignAddress.Province', 'f', NULL, NULL),
(10, now(), now(), NULL, 'Foreign Postal Code',           'Line3f_PostalCode',      '{Beneficiary.OutsideUS} == ''Yes''', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 10, 'Beneficiary.ForeignAddress.PostalCode', 'f', NULL, NULL),
(11, now(), now(), NULL, 'Foreign Country',               'Line_Country',           '{Beneficiary.OutsideUS} == ''Yes''', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 1, 11, 'Beneficiary.ForeignAddress.Country', 'f', 'limit-1', NULL),

-- Beneficiary: Dependents (Part 4, Q5 Yes/No)
(27, now(), now(), NULL, 'Are you filing applications for dependents?', NULL, NULL, 't', 'SELECT_ONE', NULL, 'Part 4 Q5 Yes/No', NULL, NULL, NULL, 1, 11, 'Beneficiary.Dependents.HasDependents', 'f', NULL, NULL),

-- Beneficiary: Outside U.S. controller (capture-only in DB; drives foreign address visibility)
(28, now(), now(), NULL, 'Is the beneficiary outside the United States?', NULL, NULL, 't', 'SELECT_ONE', NULL, 'Controller for foreign address fields', NULL, NULL, NULL, 1, 6, 'Beneficiary.OutsideUS', 'f', 'limit-1', NULL),

-- Beneficiary: Number of dependent applications (Part 4, Q5)
(12, now(), now(), NULL, 'Number of dependent applications', 'P4Line5_HowMany', '{Beneficiary.Dependents.HasDependents} == ''Yes''', 't', 'NUMBER', NULL, NULL, NULL, NULL, NULL, 1, 12, 'Beneficiary.Dependents.Count', 'f', NULL, NULL),

-- Employer: Authorized signatory title (H Classification Supplement, explicit Title field)
(13, now(), now(), NULL, 'Authorized signatory title', 'Line27_Title', NULL, 't', 'TEXT', NULL, 'H Classification Supplement: Title of Authorized Signatory', NULL, NULL, NULL, 2, 13, 'Employer.Signatory.Title', 'f', NULL, NULL),

-- Employer: Contact info (Part 1 Contact Information)
(14, now(), now(), NULL, 'Daytime telephone number', 'Line2_DaytimePhoneNumber1_Part8', NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 2, 14, 'Employer.Contact.DaytimePhone', 'f', NULL, 'US_TELEPHONE'),
(15, now(), now(), NULL, 'Mobile telephone number',  'Line3_MobilePhoneNumber1_Part8', NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 2, 15, 'Employer.Contact.MobilePhone', 'f', NULL, 'US_TELEPHONE'),
(16, now(), now(), NULL, 'Email address',            'Line9_EmailAddress',            NULL, 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 2, 16, 'Employer.Contact.Email', 'f', NULL, 'EMAIL'),

-- Employer: Employee counts (Part 5)
(17, now(), now(), NULL, 'Current number of employees (US)', 'P5Line14_NumberofEmployees', NULL, 't', 'NUMBER', NULL, NULL, NULL, NULL, NULL, 2, 17, 'Employer.EmployeeCount.TotalUS', 'f', NULL, NULL),
-- Not directly present in template (H-1B employees). Capture for app; PDF mapping can be added later.
(18, now(), now(), NULL, 'Number of employees on H-1B', NULL, NULL, 't', 'NUMBER', NULL, 'Capture only; no direct PDF field in template', NULL, NULL, NULL, 2, 18, 'Employer.EmployeeCount.H1B', 'f', 'limit-2', NULL),

-- Employer: Point of contact name (use Part 7 Authorized Signatory name fields)
(19, now(), now(), NULL, 'POC Family Name (Last Name)', 'Line1a_PetitionerLastName', NULL, 't', 'TEXT', NULL, 'Authorized Signatory Family Name', NULL, NULL, NULL, 2, 19, 'Employer.POC.FamilyName', 'f', NULL, NULL),
(20, now(), now(), NULL, 'POC Given Name (First Name)', 'Line1b_PetitionerFirstName', NULL, 't', 'TEXT', NULL, 'Authorized Signatory Given Name', NULL, NULL, NULL, 2, 20, 'Employer.POC.GivenName', 'f', NULL, NULL),
-- Middle name not present in Part 7; keep as capture-only for now
(21, now(), now(), NULL, 'POC Middle Name', NULL, NULL, 't', 'TEXT', NULL, 'Capture only; no direct PDF field in template', NULL, NULL, NULL, 2, 21, 'Employer.POC.MiddleName', 't', NULL, NULL),

-- Job: Location where beneficiary will work (Part 5, Q3 Address 1)
(22, now(), now(), NULL, 'Job location street number and name', 'P5Line3a_StreetNumberName', '({Job.OffsiteWork} == ''Yes'') && ({Job.Location.UseHomeAddress} == ''No'')', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 3, 24, 'Job.Location.Address1.StreetNumberName', 'f', NULL, NULL),
(23, now(), now(), NULL, 'Job location city',                  'P5Line3a_CityTown',        '({Job.OffsiteWork} == ''Yes'') && ({Job.Location.UseHomeAddress} == ''No'')', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 3, 25, 'Job.Location.Address1.City', 'f', NULL, NULL),
(24, now(), now(), NULL, 'Job location state',                 'P5Line3a_State',           '({Job.OffsiteWork} == ''Yes'') && ({Job.Location.UseHomeAddress} == ''No'')', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 3, 26, 'Job.Location.Address1.State', 'f', NULL, 'US_STATE'),
(25, now(), now(), NULL, 'Job location ZIP code',              'P5Line3a_ZipCode',         '({Job.OffsiteWork} == ''Yes'') && ({Job.Location.UseHomeAddress} == ''No'')', 't', 'TEXT', NULL, NULL, NULL, NULL, NULL, 3, 27, 'Job.Location.Address1.ZIP', 'f', NULL, 'ZIP_CODE'),

(26, now(), now(), NULL, 'Work offsite or from home?', NULL, NULL, 't', 'SELECT_ONE', NULL, 'Part 5 Q5 (offsite or remote/home)', NULL, NULL, NULL, 3, 22, 'Job.OffsiteWork', 'f', NULL, NULL),

-- Job: If offsite/remote, decide whether to reuse home address for work location
(29, now(), now(), NULL, 'Use home address for work location?', NULL, '{Job.OffsiteWork} == ''Yes''', 't', 'SELECT_ONE', NULL, 'If Yes, we will reuse the beneficiary''s U.S. address for the job location', NULL, NULL, NULL, 3, 23, 'Job.Location.UseHomeAddress', 'f', 'limit-1', NULL);

-- Options for SELECT_ONE fields
INSERT INTO "public"."form_template_field_option" ("id", "created_at", "updated_at", "deleted_at", "key", "pdf_field_name", "name", "field_id") VALUES

-- Beneficiary.Gender
(1, now(), now(), NULL, 'Beneficiary.Gender', 'Line1_Gender_P3[0]', 'Male',   1),
(2, now(), now(), NULL, 'Beneficiary.Gender', 'Line1_Gender_P3[1]', 'Female', 1),

-- Beneficiary.Dependents.HasDependents
(5, now(), now(), NULL, 'Beneficiary.Dependents.HasDependents', 'P4Line5_Yes', 'Yes', 27),
(6, now(), now(), NULL, 'Beneficiary.Dependents.HasDependents', 'P4Line5_No',  'No',  27),

-- Beneficiary.OutsideUS (capture-only; no direct PDF control)
(7, now(), now(), NULL, 'Beneficiary.OutsideUS', NULL, 'Yes', 28),
(8, now(), now(), NULL, 'Beneficiary.OutsideUS', NULL, 'No',  28),

-- Job.OffsiteWork (Part 5 Q5)
(3, now(), now(), NULL, 'Job.OffsiteWork', 'P5Line5_Yes', 'Yes', 26),
(4, now(), now(), NULL, 'Job.OffsiteWork', 'P5Line5_No',  'No',  26),

-- Job.Location.UseHomeAddress (UI control only; no direct PDF mapping)
(9, now(), now(), NULL, 'Job.Location.UseHomeAddress', NULL, 'Yes', 29),
(10, now(), now(), NULL, 'Job.Location.UseHomeAddress', NULL, 'No',  29);

-- Reset sequences to max ids
SELECT setval('form_template_id_seq', (SELECT MAX(id) FROM form_template));
SELECT setval('form_template_section_id_seq', (SELECT MAX(id) FROM form_template_section));
SELECT setval('form_template_field_id_seq', (SELECT MAX(id) FROM form_template_field));
SELECT setval('form_template_field_option_id_seq', (SELECT MAX(id) FROM form_template_field_option));

-- Example user and client to maintain relationships
INSERT INTO "public"."user" ("id", "public_id", "created_at", "updated_at", "role", "email", "last_authenticated_at", "external_id") VALUES
(1, '723c7ae0-6db2-4a87-a12b-75f2f06f77f1', now(), now(), 'CLIENT', NULL, now(), 'test_user_123');

INSERT INTO "public"."client" ("id", "public_id", "created_at", "updated_at", "name", "user_id", "first_name", "last_name", "address", "city", "state", "zip", "telephone", "naics_code", "fein") VALUES
(1, '723c7ae0-6db2-4a87-a12b-75f2f06f77f1', '2025-08-18 13:36:29.671179-05', '2025-08-19 09:00:31.145722-05', 'Test Client', 1, 'Test', 'Client', '123 Main', 'Boston', 'MA', '01234', '212-555-1212', '123456', '98-7654321');

SELECT setval('user_id_seq', (SELECT MAX(id) FROM "user"));
SELECT setval('client_id_seq', (SELECT MAX(id) FROM "client"));
