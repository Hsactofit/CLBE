// API Types matching backend Pydantic schemas
// Generated from crossing-backend/app/schemas.py

import { Project } from "./project"

// ============================================================================
// ENUMS
// ============================================================================

export interface ProjectType {
  description: string
  enabled: boolean
  id: number
  name: string
  sequence: number
}

// ============================================================================
// USERS
// ============================================================================

export interface UserPublic {
  publicId: string // User's public ID (Clerk user_id)
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

// ============================================================================
// CLIENTS
// ============================================================================

export interface ClientPublic {
  publicId: string // Client's public ID (UUID)
  name: string // Client/company name
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface ProjectCreate {
  type: {}
}

export interface ProjectPublic {
  publicId: string // Project's public ID (UUID)
  type: ProjectType
  startedAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
  completed: boolean
}

export interface ProjectDetailResponse {
  project: Project
}

export interface ProjectsPublic {
  projects: Project[]
}

// ============================================================================
// FORMS
// ============================================================================

export interface FormPublic {
  publicId: string // Form's public ID (UUID)
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
  completed: boolean
  form_template_name: string
}

export interface FormsPublic {
  forms: FormPublic[]
}

export interface SectionPublic {
  publicId: string // Section's public ID (UUID)
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
  name: string
}

export interface SectionsPublic {
  sections: SectionPublic[]
}

export interface FieldPublic {
  name: string
  value: string | null // Could be null if field is not filled yet
  role: string | null // Respondent role
}

export interface FieldsPublic {
  fields: FieldPublic[]
}

export interface SectionFieldsPublic extends SectionPublic {
  fields: FieldPublic[]
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  detail: string
  statusCode: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DateTimeString = string // ISO 8601 datetime string
export type UUID = string // UUID string format
