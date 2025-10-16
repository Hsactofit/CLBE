'use client'
import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/landing.module.css'
import {
  ShieldCheck,
  Settings,
  Download,
  Upload,
  ClipboardListIcon,
  Clock,
  Users2,
  Check,
  Scale,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Phone,
} from 'lucide-react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { API_ENDPOINTS } from '@/lib/api'
import Image from 'next/image'

export const navItems = [
  { name: 'About', link: '#about' },
  { name: 'Services', link: '#services' },
  { name: 'How It Works', link: '#howitworks' },
  { name: 'Testimonials', link: '#testimonials' },
]

export const badges = [
  { icon: Agentic, text: 'Agentic AI workflows' },
  { icon: Brain, text: 'Custom LLM trained on your policies' },
  { icon: Hexagone, text: '2x faster acceptance' },
]

export const features = [
  {
    icon: Users2,
    title: 'Workflow Automation',
    desc: 'Automate multi-step petition workflows with signature collection, status tracking, and automated notifications for each stage of your application.',
  },
  {
    icon: Upload,
    title: 'Smart Document Upload',
    desc: 'Drag and drop your legal documents. Our AI detects document types and extracts key information.',
  },
  {
    icon: ClipboardListIcon,
    title: 'AI-Guided Wizard',
    desc: 'Step-by-step guidance with intelligent suggestions based on your documents and legal requirements.',
  },
  {
    icon: Scale,
    title: 'Attorney-Reviewed',
    desc: 'Every application is reviewed for accuracy and completeness by a licensed attorney.',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Level Security',
    desc: 'Enterprise-grade encryption, granular permissions, and audit logs to protect sensitive data.',
  },
  {
    icon: Clock,
    title: '2x Faster Processing',
    desc: 'Standard immigration applications take weeks of lawyer time. Our automated system delivers self-service petitions in a fraction of the time.',
  },
]

export const steps = [
  {
    icon: Upload,
    title: 'Upload Documents',
    desc: 'Securely upload legal documents and supporting materials.|Our AI extracts key information and pre-populates the application.',
    duration: '~5 min',
  },
  {
    icon: Settings,
    title: 'AI-Guided Setup',
    desc: 'Our wizard gathers data and manages the application workflow.|Your custom policies can be imported to guide the AI model.',
    duration: '~5 min',
  },
  {
    icon: Check,
    title: 'Review & Validate',
    desc: 'Our AI checks for completeness and flags potential issues, such as missing required documents or conflicting information.',
    duration: '~3 min',
  },
  {
    icon: Download,
    title: 'Download Package',
    desc: 'After validation is complete, the system prepares submission-ready, auto-filled document set, with all supporting documents.',
    duration: '~1 min',
  },
  {
    icon: Scale,
    title: 'Attorney Review',
    desc: 'An in-house attorney reviews the completed application, ensuring it is accurate, complete, and compliant with US immigration laws.',
    duration: '~30 min',
  },
]

export const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Chief People Officer, Loopline',
    quote:
      'Crossing Legal AI has revolutionized how our firm handles H-1B preparation. What used to take our HR team hours now takes minutes. The AI suggestions are remarkably accurate.',
    initials: 'SC',
  },
  {
    name: 'Michael Patel',
    role: 'Global Mobility Manager, Kairoo',
    quote:
      'The platform streamlines our sponsorship and petition process. Employees love getting updates on the status of their applications, and our team saves countless hours on document checks and rework.',
    initials: 'MP',
  },
  {
    name: 'Laura Gómez',
    role: 'Immigration & Global Mobility Manager, TrueNorth Dental',
    quote:
      'Setup was fast and the workflow automation is intuitive. Turnaround times dropped significantly, and the applications now sail through because Crossing does an exhaustive validation of the application package.',
    initials: 'LG',
  },
]

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const section = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.12, ease: EASE },
  },
}

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const riseFast = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

const header: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}

// Individual pieces (title, subtitle)
const headerPiece: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}
// Grid → stagger cards
const grid: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      ease: EASE,
    },
  },
}

// Card entrance (slight lift + blur for smoothness)
const card: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(40px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE, when: 'beforeChildren' },
  },
}

// Inside a card, stagger its children (icon → title → desc)
const cardInner: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, ease: EASE },
  },
}

// Individual pieces inside the card
const piece: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: EASE },
  },
}

const headerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

const stepItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE },
  },
}

const bodyItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

const DURATIONS = ['~2 min', '~3 min', '~3 min', '~1 min']

// Icons
export function Agentic({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.022 21.522" {...props}>
      <path
        d="M 3.042 21.522 C 2.198 21.522 1.48 21.228 0.888 20.639 C 0.296 20.05 0 19.334 0 18.493 C 0 17.807 0.207 17.195 0.621 16.657 C 1.035 16.118 1.558 15.761 2.19 15.586 L 2.19 5.948 C 1.558 5.772 1.035 5.415 0.621 4.877 C 0.207 4.338 0 3.726 0 3.04 C 0 2.196 0.295 1.478 0.886 0.887 C 1.477 0.296 2.194 0 3.038 0 C 3.882 0 4.6 0.296 5.192 0.887 C 5.785 1.478 6.081 2.196 6.081 3.04 C 6.081 3.726 5.875 4.338 5.465 4.877 C 5.054 5.415 4.53 5.772 3.89 5.948 L 3.89 6.353 C 3.89 7.343 4.233 8.185 4.92 8.877 C 5.607 9.57 6.44 9.917 7.421 9.917 L 9.6 9.917 C 11.045 9.917 12.276 10.429 13.293 11.453 C 14.311 12.477 14.82 13.716 14.82 15.169 L 14.82 15.586 C 15.46 15.761 15.986 16.116 16.4 16.651 C 16.815 17.186 17.022 17.796 17.022 18.482 C 17.022 19.327 16.724 20.045 16.128 20.636 C 15.532 21.227 14.814 21.522 13.972 21.522 C 13.13 21.522 12.414 21.227 11.825 20.636 C 11.236 20.045 10.941 19.327 10.941 18.482 C 10.941 17.796 11.146 17.186 11.557 16.651 C 11.967 16.116 12.488 15.761 13.12 15.586 L 13.12 15.169 C 13.12 14.188 12.778 13.351 12.094 12.657 C 11.409 11.964 10.578 11.617 9.6 11.617 L 7.421 11.617 C 6.721 11.617 6.07 11.485 5.468 11.221 C 4.867 10.957 4.341 10.599 3.89 10.146 L 3.89 15.586 C 4.53 15.761 5.054 16.116 5.465 16.651 C 5.875 17.186 6.081 17.796 6.081 18.482 C 6.081 19.327 5.785 20.045 5.194 20.636 C 4.604 21.227 3.886 21.522 3.042 21.522 Z M 3.046 19.833 C 3.421 19.833 3.738 19.705 3.995 19.448 C 4.252 19.191 4.381 18.873 4.381 18.493 C 4.381 18.114 4.252 17.795 3.995 17.538 C 3.738 17.281 3.42 17.152 3.04 17.152 C 2.668 17.152 2.352 17.283 2.091 17.544 C 1.83 17.805 1.7 18.121 1.7 18.493 C 1.7 18.865 1.83 19.181 2.091 19.442 C 2.352 19.703 2.67 19.833 3.046 19.833 Z M 13.976 19.833 C 14.351 19.833 14.668 19.705 14.925 19.448 C 15.182 19.191 15.311 18.873 15.311 18.493 C 15.311 18.114 15.182 17.795 14.925 17.538 C 14.669 17.281 14.35 17.152 13.97 17.152 C 13.598 17.152 13.282 17.283 13.021 17.544 C 12.76 17.805 12.63 18.121 12.63 18.493 C 12.63 18.865 12.76 19.181 13.021 19.442 C 13.282 19.703 13.6 19.833 13.976 19.833 Z M 3.046 4.381 C 3.421 4.381 3.738 4.252 3.995 3.996 C 4.252 3.739 4.381 3.421 4.381 3.041 C 4.381 2.661 4.252 2.343 3.995 2.086 C 3.738 1.829 3.42 1.7 3.04 1.7 C 2.668 1.7 2.352 1.83 2.091 2.091 C 1.83 2.352 1.7 2.669 1.7 3.04 C 1.7 3.412 1.83 3.729 2.091 3.99 C 2.352 4.25 2.67 4.381 3.046 4.381 Z"
        fill="rgb(50, 194, 79)"
      ></path>
    </svg>
  )
}
export function ArrowRight({ ...props }) {
  return (
    <svg viewBox="0 0 10.547 10.374" {...props}>
      <path
        d="M 8.747 5.733 L 0.541 5.733 C 0.387 5.733 0.259 5.681 0.155 5.577 C 0.052 5.474 0 5.345 0 5.192 C 0 5.038 0.052 4.91 0.155 4.806 C 0.259 4.703 0.387 4.651 0.541 4.651 L 8.747 4.651 L 5.018 0.922 C 4.911 0.815 4.858 0.69 4.859 0.546 C 4.861 0.402 4.918 0.274 5.029 0.162 C 5.141 0.058 5.268 0.004 5.409 0 C 5.551 -0.004 5.678 0.051 5.79 0.162 L 10.362 4.735 C 10.43 4.803 10.478 4.874 10.505 4.949 C 10.533 5.024 10.547 5.105 10.547 5.192 C 10.547 5.279 10.533 5.36 10.505 5.434 C 10.478 5.509 10.43 5.581 10.362 5.648 L 5.79 10.221 C 5.69 10.321 5.566 10.372 5.418 10.374 C 5.271 10.377 5.141 10.326 5.029 10.221 C 4.918 10.109 4.862 9.981 4.862 9.836 C 4.862 9.69 4.918 9.562 5.029 9.45 Z"
        fill="currentColor"
      ></path>
    </svg>
  )
}
export function Brain({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.136 20.249" {...props}>
      <path
        d="M 7.421 20.249 C 6.481 20.249 5.673 19.923 4.997 19.272 C 4.32 18.622 3.948 17.832 3.88 16.905 C 2.802 16.74 1.904 16.247 1.188 15.425 C 0.471 14.603 0.113 13.639 0.113 12.534 C 0.113 12.148 0.163 11.766 0.264 11.389 C 0.364 11.013 0.514 10.659 0.715 10.328 C 0.477 9.982 0.298 9.609 0.179 9.207 C 0.06 8.805 0 8.383 0 7.941 C 0 6.813 0.371 5.837 1.114 5.013 C 1.857 4.19 2.777 3.711 3.874 3.577 C 3.866 3.547 3.862 3.516 3.862 3.486 L 3.862 3.384 C 3.898 2.437 4.261 1.636 4.949 0.982 C 5.638 0.327 6.462 0 7.421 0 C 7.961 0 8.442 0.106 8.864 0.317 C 9.287 0.528 9.688 0.826 10.068 1.213 C 10.443 0.826 10.842 0.528 11.263 0.317 C 11.683 0.106 12.168 0 12.715 0 C 13.664 0 14.48 0.326 15.164 0.978 C 15.848 1.631 16.208 2.427 16.244 3.366 L 16.244 3.468 C 16.244 3.498 16.241 3.529 16.233 3.559 C 17.33 3.693 18.254 4.173 19.007 4.999 C 19.76 5.825 20.136 6.805 20.136 7.941 C 20.136 8.383 20.074 8.805 19.951 9.207 C 19.829 9.609 19.648 9.982 19.409 10.328 C 19.61 10.658 19.762 11.012 19.866 11.389 C 19.971 11.766 20.023 12.148 20.023 12.534 C 20.023 13.659 19.661 14.63 18.939 15.446 C 18.216 16.261 17.312 16.748 16.226 16.905 C 16.158 17.832 15.791 18.622 15.124 19.272 C 14.458 19.923 13.655 20.249 12.715 20.249 C 12.172 20.249 11.689 20.146 11.266 19.941 C 10.843 19.736 10.443 19.436 10.068 19.043 C 9.68 19.436 9.276 19.736 8.855 19.941 C 8.435 20.146 7.956 20.249 7.421 20.249 Z M 10.95 3.529 L 10.95 16.719 C 10.95 17.214 11.121 17.631 11.464 17.972 C 11.806 18.314 12.224 18.484 12.72 18.484 C 13.192 18.484 13.596 18.308 13.933 17.957 C 14.27 17.605 14.453 17.196 14.48 16.728 C 13.985 16.624 13.528 16.436 13.11 16.164 C 12.691 15.892 12.33 15.543 12.025 15.117 C 11.874 14.911 11.817 14.691 11.854 14.458 C 11.891 14.224 12.014 14.035 12.222 13.889 C 12.428 13.738 12.65 13.681 12.886 13.719 C 13.122 13.756 13.314 13.878 13.461 14.086 C 13.705 14.44 14.015 14.711 14.391 14.899 C 14.767 15.087 15.173 15.181 15.611 15.181 C 16.349 15.181 16.974 14.924 17.488 14.411 C 18.001 13.897 18.258 13.271 18.258 12.534 C 18.258 12.385 18.244 12.237 18.215 12.089 C 18.186 11.941 18.141 11.795 18.079 11.651 C 17.746 11.878 17.378 12.051 16.976 12.172 C 16.574 12.292 16.157 12.353 15.724 12.353 C 15.474 12.353 15.265 12.268 15.095 12.099 C 14.926 11.93 14.842 11.72 14.842 11.47 C 14.842 11.22 14.926 11.01 15.095 10.841 C 15.265 10.673 15.474 10.588 15.724 10.588 C 16.462 10.588 17.087 10.331 17.601 9.818 C 18.114 9.304 18.371 8.679 18.371 7.941 C 18.371 7.215 18.118 6.599 17.612 6.094 C 17.106 5.588 16.492 5.321 15.769 5.294 C 15.569 5.654 15.304 5.969 14.976 6.237 C 14.648 6.506 14.282 6.718 13.878 6.875 C 13.647 6.963 13.422 6.955 13.202 6.854 C 12.982 6.752 12.836 6.584 12.763 6.351 C 12.687 6.12 12.696 5.893 12.79 5.671 C 12.883 5.448 13.049 5.299 13.287 5.224 C 13.642 5.103 13.929 4.889 14.149 4.581 C 14.37 4.274 14.48 3.921 14.48 3.524 C 14.48 3.033 14.309 2.617 13.968 2.276 C 13.626 1.935 13.209 1.764 12.714 1.764 C 12.22 1.764 11.802 1.935 11.461 2.276 C 11.121 2.617 10.95 3.035 10.95 3.529 Z M 9.186 16.719 L 9.186 3.529 C 9.186 3.035 9.015 2.617 8.674 2.276 C 8.332 1.935 7.915 1.764 7.42 1.764 C 6.926 1.764 6.508 1.935 6.167 2.276 C 5.827 2.617 5.656 3.035 5.656 3.529 C 5.656 3.911 5.763 4.259 5.977 4.572 C 6.192 4.886 6.476 5.103 6.83 5.224 C 7.061 5.299 7.23 5.446 7.337 5.665 C 7.444 5.884 7.461 6.109 7.386 6.342 C 7.298 6.574 7.142 6.741 6.92 6.843 C 6.697 6.944 6.467 6.952 6.229 6.864 C 5.824 6.707 5.458 6.496 5.13 6.232 C 4.802 5.967 4.538 5.654 4.337 5.294 C 3.634 5.321 3.03 5.591 2.524 6.105 C 2.018 6.619 1.765 7.232 1.765 7.945 C 1.765 8.68 2.021 9.304 2.535 9.818 C 3.049 10.331 3.674 10.588 4.412 10.588 C 4.662 10.588 4.871 10.673 5.041 10.842 C 5.21 11.011 5.294 11.221 5.294 11.471 C 5.294 11.721 5.21 11.93 5.041 12.099 C 4.871 12.268 4.662 12.353 4.412 12.353 C 3.979 12.353 3.562 12.292 3.16 12.172 C 2.758 12.051 2.39 11.878 2.057 11.651 C 1.995 11.795 1.95 11.941 1.921 12.089 C 1.892 12.237 1.878 12.385 1.878 12.534 C 1.878 13.271 2.135 13.897 2.648 14.411 C 3.162 14.924 3.787 15.181 4.525 15.181 C 4.965 15.181 5.371 15.086 5.745 14.897 C 6.119 14.708 6.429 14.437 6.674 14.086 C 6.822 13.878 7.014 13.756 7.25 13.719 C 7.486 13.681 7.707 13.736 7.914 13.883 C 8.121 14.03 8.243 14.221 8.281 14.456 C 8.318 14.69 8.262 14.911 8.111 15.117 C 7.799 15.543 7.43 15.895 7.006 16.173 C 6.581 16.451 6.121 16.642 5.627 16.746 C 5.654 17.214 5.841 17.621 6.188 17.966 C 6.535 18.311 6.944 18.484 7.416 18.484 C 7.911 18.484 8.33 18.314 8.672 17.972 C 9.015 17.631 9.186 17.214 9.186 16.719 Z M 10.068 10.124"
        fill="rgb(97, 160, 255)"
      ></path>
    </svg>
  )
}
export function CheckCircle({ ...props }) {
  return (
    <svg viewBox="0 0 7 7" {...props}>
      <path
        d="M 3.501 7 C 3.017 7 2.562 6.908 2.136 6.724 C 1.71 6.541 1.339 6.291 1.024 5.976 C 0.709 5.661 0.46 5.291 0.276 4.865 C 0.092 4.44 0 3.985 0 3.501 C 0 3.017 0.092 2.562 0.276 2.136 C 0.459 1.71 0.709 1.339 1.024 1.024 C 1.339 0.709 1.709 0.46 2.135 0.276 C 2.561 0.092 3.016 0 3.5 0 C 3.807 0 4.104 0.039 4.391 0.117 C 4.679 0.195 4.954 0.308 5.217 0.456 C 5.288 0.496 5.334 0.553 5.356 0.628 C 5.377 0.702 5.365 0.772 5.317 0.837 C 5.27 0.901 5.208 0.942 5.13 0.958 C 5.052 0.975 4.977 0.963 4.905 0.923 C 4.69 0.803 4.463 0.711 4.225 0.648 C 3.987 0.584 3.746 0.553 3.5 0.553 C 2.683 0.553 1.988 0.84 1.414 1.414 C 0.84 1.988 0.553 2.683 0.553 3.5 C 0.553 4.317 0.84 5.012 1.414 5.586 C 1.988 6.16 2.683 6.447 3.5 6.447 C 4.317 6.447 5.012 6.16 5.586 5.586 C 6.16 5.012 6.447 4.317 6.447 3.5 C 6.447 3.429 6.445 3.36 6.439 3.293 C 6.434 3.226 6.424 3.157 6.411 3.087 C 6.399 3.008 6.412 2.934 6.452 2.862 C 6.491 2.79 6.55 2.744 6.629 2.723 C 6.703 2.702 6.772 2.711 6.835 2.75 C 6.899 2.79 6.937 2.847 6.949 2.922 C 6.966 3.015 6.979 3.109 6.987 3.204 C 6.996 3.299 7 3.398 7 3.5 C 7 3.984 6.908 4.439 6.724 4.865 C 6.541 5.291 6.291 5.661 5.976 5.976 C 5.661 6.291 5.291 6.541 4.865 6.724 C 4.44 6.908 3.985 7 3.501 7 Z M 2.977 4.291 L 6.418 0.845 C 6.469 0.794 6.532 0.767 6.607 0.763 C 6.682 0.76 6.749 0.788 6.807 0.845 C 6.859 0.898 6.886 0.963 6.886 1.039 C 6.886 1.115 6.859 1.179 6.806 1.233 L 3.21 4.834 C 3.144 4.901 3.066 4.934 2.977 4.934 C 2.888 4.934 2.811 4.901 2.744 4.834 L 1.733 3.823 C 1.682 3.772 1.656 3.708 1.655 3.631 C 1.654 3.554 1.68 3.488 1.733 3.435 C 1.786 3.381 1.851 3.355 1.927 3.355 C 2.003 3.355 2.068 3.381 2.121 3.435 Z"
        fill="rgb(69, 73, 177)"
      />
    </svg>
  )
}
export function Hexagone({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.693 20.179" {...props}>
      <path
        d="M 6.721 20.179 C 6.343 20.179 5.995 20.087 5.679 19.904 C 5.362 19.721 5.11 19.465 4.921 19.137 L 0.284 11.132 C 0.095 10.804 0 10.456 0 10.089 C 0 9.723 0.095 9.375 0.284 9.047 L 4.921 1.042 C 5.11 0.714 5.362 0.458 5.679 0.275 C 5.995 0.092 6.343 0 6.721 0 L 15.972 0 C 16.351 0 16.698 0.092 17.014 0.275 C 17.331 0.458 17.584 0.714 17.773 1.042 L 22.41 9.047 C 22.599 9.375 22.693 9.723 22.693 10.089 C 22.693 10.456 22.599 10.804 22.41 11.132 L 17.773 19.137 C 17.584 19.465 17.331 19.721 17.014 19.904 C 16.698 20.087 16.351 20.179 15.972 20.179 Z M 8.996 14.702 C 8.804 14.702 8.628 14.66 8.467 14.576 C 8.306 14.492 8.178 14.375 8.081 14.225 L 5.725 10.566 C 5.629 10.416 5.581 10.257 5.581 10.089 C 5.581 9.922 5.629 9.763 5.725 9.613 L 8.081 5.954 C 8.178 5.804 8.306 5.687 8.467 5.603 C 8.628 5.519 8.804 5.477 8.996 5.477 L 13.697 5.477 C 13.889 5.477 14.066 5.519 14.227 5.603 C 14.387 5.687 14.516 5.804 14.612 5.954 L 16.968 9.613 C 17.064 9.763 17.112 9.922 17.112 10.089 C 17.112 10.257 17.064 10.416 16.968 10.566 L 14.612 14.225 C 14.516 14.375 14.387 14.492 14.227 14.576 C 14.066 14.66 13.889 14.702 13.697 14.702 Z M 6.71 18.449 L 15.972 18.449 C 16.031 18.449 16.089 18.435 16.144 18.405 C 16.2 18.375 16.246 18.331 16.283 18.272 L 20.891 10.267 C 20.928 10.208 20.946 10.149 20.946 10.089 C 20.946 10.03 20.928 9.971 20.891 9.912 L 16.283 1.907 C 16.246 1.848 16.2 1.804 16.144 1.774 C 16.089 1.744 16.031 1.73 15.972 1.73 L 6.71 1.73 C 6.651 1.73 6.595 1.744 6.543 1.774 C 6.492 1.804 6.447 1.848 6.411 1.907 L 1.774 9.912 C 1.737 9.971 1.718 10.03 1.718 10.089 C 1.718 10.149 1.737 10.208 1.774 10.267 L 6.411 18.272 C 6.447 18.331 6.492 18.375 6.543 18.405 C 6.595 18.435 6.651 18.449 6.71 18.449 Z M 8.991 13.911 L 13.697 13.911 C 13.727 13.911 13.756 13.904 13.784 13.891 C 13.813 13.877 13.836 13.857 13.855 13.83 L 16.196 10.171 C 16.215 10.144 16.224 10.117 16.224 10.089 C 16.224 10.062 16.215 10.035 16.196 10.008 L 13.855 6.349 C 13.836 6.322 13.813 6.302 13.784 6.288 C 13.756 6.275 13.727 6.268 13.697 6.268 L 8.991 6.268 C 8.961 6.268 8.932 6.275 8.906 6.288 C 8.88 6.302 8.857 6.322 8.839 6.349 L 6.482 10.008 C 6.464 10.035 6.454 10.062 6.454 10.089 C 6.454 10.117 6.464 10.144 6.482 10.171 L 8.839 13.83 C 8.857 13.857 8.88 13.877 8.906 13.891 C 8.932 13.904 8.961 13.911 8.991 13.911 Z M 11.347 10.089 M 11.64 10.353"
        fill="rgb(255, 176, 79)"
      />
    </svg>
  )
}
export function Quote({ ...props }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 47.564 33.27">
      <path
        d="M 6.982 29.96 L 12.004 21.246 C 11.835 21.341 11.637 21.407 11.411 21.444 C 11.185 21.482 10.959 21.501 10.733 21.501 C 7.746 21.501 5.211 20.448 3.126 18.341 C 1.042 16.234 0 13.704 0 10.75 C 0 7.759 1.042 5.219 3.126 3.131 C 5.211 1.044 7.746 0 10.733 0 C 13.682 0 16.208 1.044 18.311 3.131 C 20.414 5.219 21.466 7.759 21.466 10.75 C 21.466 11.784 21.341 12.746 21.091 13.636 C 20.84 14.526 20.473 15.375 19.991 16.183 L 10.778 32.167 C 10.59 32.495 10.332 32.761 10.004 32.965 C 9.676 33.168 9.309 33.27 8.902 33.27 C 8.059 33.27 7.426 32.902 7.004 32.167 C 6.582 31.431 6.575 30.696 6.982 29.96 Z M 33.081 29.96 L 38.102 21.246 C 37.933 21.341 37.735 21.407 37.509 21.444 C 37.283 21.482 37.057 21.501 36.831 21.501 C 33.845 21.501 31.309 20.448 29.225 18.341 C 27.141 16.234 26.098 13.704 26.098 10.75 C 26.098 7.74 27.141 5.196 29.225 3.117 C 31.309 1.039 33.845 0 36.831 0 C 39.78 0 42.306 1.044 44.409 3.131 C 46.512 5.219 47.564 7.759 47.564 10.75 C 47.564 11.784 47.439 12.746 47.189 13.636 C 46.938 14.526 46.572 15.375 46.09 16.183 L 36.877 32.167 C 36.688 32.495 36.43 32.761 36.103 32.965 C 35.775 33.168 35.408 33.27 35.001 33.27 C 34.158 33.27 33.525 32.902 33.103 32.167 C 32.681 31.431 32.674 30.696 33.081 29.96 Z"
        fill="rgba(69, 73, 177, 0.2)"
      ></path>
    </svg>
  )
}
export function Star({ ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.386 14.675" {...props}>
      <path
        d="M 7.693 12.219 L 3.803 14.565 C 3.658 14.65 3.513 14.686 3.367 14.672 C 3.222 14.659 3.09 14.61 2.972 14.525 C 2.854 14.44 2.763 14.33 2.699 14.193 C 2.635 14.057 2.625 13.906 2.668 13.74 L 3.701 9.323 L 0.266 6.35 C 0.138 6.238 0.056 6.109 0.021 5.963 C -0.014 5.816 -0.005 5.673 0.049 5.535 C 0.103 5.396 0.18 5.283 0.282 5.195 C 0.383 5.107 0.521 5.05 0.697 5.023 L 5.23 4.627 L 6.989 0.456 C 7.053 0.301 7.15 0.186 7.281 0.111 C 7.411 0.037 7.548 0 7.693 0 C 7.838 0 7.975 0.037 8.106 0.111 C 8.236 0.186 8.333 0.301 8.397 0.456 L 10.157 4.627 L 14.689 5.023 C 14.865 5.05 15.003 5.107 15.105 5.195 C 15.206 5.283 15.283 5.396 15.337 5.535 C 15.391 5.673 15.4 5.816 15.365 5.963 C 15.33 6.109 15.248 6.238 15.12 6.35 L 11.685 9.323 L 12.718 13.74 C 12.762 13.906 12.751 14.057 12.687 14.193 C 12.623 14.33 12.532 14.44 12.414 14.525 C 12.296 14.61 12.165 14.659 12.019 14.672 C 11.874 14.686 11.728 14.65 11.583 14.565 Z"
        fill="rgb(250, 185, 87)"
      ></path>
    </svg>
  )
}

function ConsultationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nameRef = useRef<HTMLInputElement | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      nameRef.current?.focus()
    }, 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    const externalUrl = 'https://calendar.app.google/sTpbehiaZu9AZAm29'
    if (typeof window !== 'undefined') {
      window.location.assign(externalUrl)
    }

    onClose()
    setFullName('')
    setEmail('')
    setDescription('')
  }

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  }

  const dialogStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 560,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    padding: 24,
    position: 'relative',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: 12,
    fontSize: 22,
    lineHeight: 1.25,
    fontWeight: 700,
    color: '#0f172a',
  }

  const subStyle: React.CSSProperties = {
    marginTop: 6,
    marginBottom: 18,
    color: '#475569',
    fontSize: 14,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
    color: '#0f172a',
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: 14,
    color: '#0f172a',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03) inset',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: 96,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    width: '100%',
    marginBottom: 14,
  }

  const colHalfStyle: React.CSSProperties = {
    width: '50%',
  }

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginTop: 18,
  }

  const primaryBtnStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  }

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
  }

  const errorStyle: React.CSSProperties = {
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 6,
  }

  return (
    <div
      style={backdropStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a consultation form"
    >
      <div style={dialogStyle}>
        <button aria-label="Close" onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
        <h3 style={headerStyle}>Schedule a Free Consultation</h3>
        <p style={subStyle}>
          Tell us a bit about your situation, and we&apos;ll be in touch shortly.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={rowStyle}>
            <div style={colHalfStyle}>
              <label htmlFor="fullName" style={labelStyle}>
                Full name
              </label>
              <input
                ref={nameRef}
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                style={inputStyle}
                autoComplete="name"
                required
              />
            </div>
            <div style={colHalfStyle}>
              <label htmlFor="email" style={labelStyle}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                style={inputStyle}
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label htmlFor="description" style={labelStyle}>
              Briefly describe your case
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What would you like help with?"
              style={textareaStyle}
            />
          </div>
          {error ? <div style={errorStyle}>{error}</div> : null}
          <div style={buttonRowStyle}>
            <button type="submit" style={primaryBtnStyle}>
              Schedule a Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default function Page() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Services />
      <HowItWorks />
      <ProductVideo />
      <Testimonials />
      <Team />
      <Footer />
    </>
  )
}
export function Navbar() {
  const [open, setOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault()
    const element = document.querySelector(link)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles['navbar-container']}>
        {/* Left: Logo */}
        <Link href="#" className={styles.logoLink}>
          <Image
            src="/logo-white.png"
            alt="logo"
            width={160}
            height={40}
            className={styles.logoImg}
            style={{ width: 'auto', height: '40px' }}
            priority
          />
        </Link>

        {/* Right: links + CTA (desktop) */}
        <div className={styles.desktopRight}>
          <div className={styles.links}>
            {navItems.map(n => (
              <a
                key={n.name}
                href={n.link}
                className={styles.link}
                onClick={e => handleNavClick(e, n.link)}
              >
                {n.name}
              </a>
            ))}
          </div>
          <div className={styles.ctaWrap}>
            <Link href={API_ENDPOINTS.LOGIN} className={styles.ctaPrimary}>
              Login
            </Link>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(s => !s)}
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </div>

      {/* Mobile overlay + sheet */}
      {open && (
        <div className={styles.overlay}>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className={styles.backdrop}
          />
          <div className={styles.sheetOuter}>
            <div className={styles.sheet}>
              <div className={styles.sheetLinks}>
                {navItems.map(n => (
                  <Link
                    key={n.name}
                    href={n.link}
                    className={styles.sheetLink}
                    onClick={() => setOpen(false)}
                  >
                    {n.name}
                  </Link>
                ))}
                <hr className={styles.sheetDivider} />
                <a href="#login" className={styles.sheetLogin} onClick={() => setOpen(false)}>
                  Login
                </a>
                <a href="#get-started" className={styles.sheetCTA} onClick={() => setOpen(false)}>
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
export function Hero() {
  return (
    <div className={styles.heroContainer}>
      {/* Background video */}
      <video
        ref={el => {
          if (el) el.playbackRate = 0.5
        }}
        src="/videos/landing.mp4"
        autoPlay
        loop
        muted
        playsInline
        className={styles.heroVideo}
        style={{
          transition: 'opacity 0.5s ease-in-out',
        }}
      />
      {/* Overlay for contrast */}
      <div className={styles.heroOverlay} />

      {/* Content */}
      <div className={styles.heroContent}>
        <motion.section
          className={styles.heroSection}
          variants={section}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          {/* Title + Subtitle */}
          <motion.h1 variants={rise} className={styles.heroTitle}>
            US Immigration
            <span className={styles.heroTitleHighlight}>Simplified</span>
          </motion.h1>

          <motion.p variants={riseFast} className={styles.heroSubtitle}>
            Streamline your legal document preparation and government petitions <br />
            with Crossing Legal AI.
            <br />
          </motion.p>

          {/* CTAs */}
          <HeroCTAWithModal />
        </motion.section>
      </div>
    </div>
  )
}

function HeroCTAWithModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.div variants={riseFast} className={styles.ctaWrapper}>
        <motion.a
          href="#consultation"
          className={styles.primaryBtn}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.18, ease: EASE }}
          onClick={e => {
            e.preventDefault()
            setIsOpen(true)
          }}
        >
          Get Started Now
          <ArrowRight className={styles.ctaIcon} />
        </motion.a>
      </motion.div>
      <ConsultationModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
export function Features() {
  return (
    <section id="about" className={styles.featuresSection}>
      <motion.div
        variants={header}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className={styles.featuresHeader}
      >
        <motion.h2 variants={headerPiece} className={styles.featuresTitle}>
          Everything You Need for Your US Immigration Workflows
        </motion.h2>
        <motion.p variants={headerPiece} className={styles.featuresSubtitle}>
          Our AI-powered platform combines cutting-edge technology with legal expertise to
          streamline your document workflow from start to finish.
        </motion.p>
      </motion.div>

      <motion.div
        variants={grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25, margin: '0px 0px -80px 0px' }}
        className={styles.featuresGrid}
      >
        {features.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={i}
              variants={card}
              className={styles.featureCard}
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <motion.div variants={cardInner}>
                <motion.div variants={piece} className={styles.featureIconWrapper}>
                  <Icon className={styles.featureIcon} />
                </motion.div>
                <motion.h3 variants={piece} className={styles.featureTitle}>
                  {f.title}
                </motion.h3>
                <motion.p variants={piece} className={styles.featureDesc}>
                  {f.desc}
                </motion.p>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
export function HowItWorks() {
  return (
    <motion.section
      id="howitworks"
      className={styles['how-it-works-section']}
      variants={section}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
    >
      <div className={styles['how-it-works-container']}>
        {/* Heading */}
        <div className={styles.framerHeaderWrap}>
          <motion.h2 variants={headerItem} className={styles.title}>
            How It Works
          </motion.h2>
          <motion.p variants={headerItem} className={styles.subtitle}>
            Transform your petition preparation in five simple steps
          </motion.p>
        </div>

        <div className={styles.timelineWrap}>
          {/* Steps */}
          <motion.div variants={grid} className={styles['how-it-works-grid']}>
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={i} variants={stepItem} className={styles.step}>
                  <div className={styles.stepTopRow}>
                    {/* Icon circle with a subtle hover pop & glow */}
                    <motion.div className={styles.iconCircle}>
                      <Icon className={styles.stepIcon} />
                      <div className={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</div>
                    </motion.div>
                  </div>

                  {/* Body fades up after the step enters */}
                  <motion.div variants={bodyItem} className={styles.stepBody}>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepDesc}>
                      {s.desc.split('|').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < s.desc.split('|').length - 1 && (
                            <>
                              <br />
                            </>
                          )}
                        </span>
                      ))}
                    </p>
                  </motion.div>
                  <div className={styles.durationPill}>
                    <Clock className={styles.durationIcon} />
                    <span>{(s as { duration?: string }).duration ?? DURATIONS[i]}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
export function Testimonials() {
  return (
    <section id="testimonials" className={styles['testimonials-section']}>
      <div className={styles['testimonials-container']}>
        {/* Header */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        >
          <motion.h2 variants={headerPiece} className={styles.title}>
            Trusted by HR and Mobility Professionals
          </motion.h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          className={styles.grid}
        >
          {testimonials.map((t, i) => (
            <motion.figure key={i} variants={card} className={styles.card}>
              {/* inner pieces */}
              <motion.div variants={cardInner}>
                <motion.div variants={piece}>
                  <Quote className={styles.quoteIcon} />
                </motion.div>

                <motion.div variants={piece} className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={styles.star} aria-hidden="true" />
                  ))}
                </motion.div>

                <motion.blockquote variants={piece} className={styles.quote}>
                  &quot;{t.quote}&quot;
                </motion.blockquote>

                <motion.hr variants={piece} className={styles.divider} />

                <motion.figcaption variants={piece} className={styles.person}>
                  <div className={styles.avatar}>{t.initials}</div>
                  <div>
                    <div className={styles.personName}>{t.name}</div>
                    <div className={styles.personRole}>{t.role}</div>
                  </div>
                </motion.figcaption>
              </motion.div>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function ProductVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    // Ensure autoplay works cross-browser
    el.muted = true
    el.playsInline = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: [0, 0.25, 0.5, 1] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.section
      style={{ background: '#f0f0f0' }}
      variants={section}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 16px' }}>
        <motion.div variants={card}>
          <video
            ref={videoRef}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              borderRadius: 10,
              boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
            }}
            src="/videos/how-it-works.mp4"
            controls
            playsInline
            muted
            preload="metadata"
          />
        </motion.div>
      </div>
    </motion.section>
  )
}

export function Team() {
  const sectionStyle: React.CSSProperties = {
    background: '#f0f0f0',
  }
  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '60px 16px',
  }
  const titleStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: 700,
    color: '#000',
    marginBottom: 16,
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginTop: 28,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 10,
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 12,
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  }
  const imgStyle: React.CSSProperties = {
    width: 192,
    height: 192,
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 10px 30px rgba(0,0,0,0.20)',
  }
  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#171717',
  }
  const roleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#525252',
    fontWeight: 500,
  }
  const linkStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 600,
  }

  return (
    <motion.section
      id="team"
      style={sectionStyle}
      variants={section}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div style={containerStyle}>
        <motion.h2 variants={headerPiece} style={titleStyle}>
          Our Team
        </motion.h2>
        <motion.div variants={grid} style={gridStyle}>
          <motion.div variants={card} style={cardStyle}>
            <Image src="/team/harish.jpg" alt="Harish" width={192} height={192} style={imgStyle} />
            <motion.div variants={cardInner} style={{ display: 'grid', gap: 8 }}>
              <motion.div variants={piece} style={nameStyle}>
                Harish
              </motion.div>
              <motion.div variants={piece} style={roleStyle}>
                Chief Executive Officer
              </motion.div>
              <motion.a
                variants={piece}
                href="https://www.linkedin.com/in/harishparwani/"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                LinkedIn
              </motion.a>
            </motion.div>
          </motion.div>
          <motion.div variants={card} style={cardStyle}>
            <Image src="/team/vidya.jpg" alt="Vidya" width={192} height={192} style={imgStyle} />
            <motion.div variants={cardInner} style={{ display: 'grid', gap: 8 }}>
              <motion.div variants={piece} style={nameStyle}>
                Vidya
              </motion.div>
              <motion.div variants={piece} style={roleStyle}>
                Advisor
              </motion.div>
              <motion.a
                variants={piece}
                href="https://www.linkedin.com/in/vidyaparwani/"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                LinkedIn
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export function Services() {
  const services: { key: string; name: string; type: string; img: string; alt: string }[] = [
    {
      key: 'h1b',
      name: 'H‑1B',
      type: 'Specialty Occupation Work Visa (Nonimmigrant)',
      img: '/services/h1b.jpg',
      alt: 'H‑1B visa stock image',
    },
    {
      key: 'eb1',
      name: 'EB‑1',
      type: 'Employment‑Based Green Card (First Preference)',
      img: '/services/eb1.jpg',
      alt: 'EB‑1 green card stock image',
    },
    {
      key: 'eb2',
      name: 'EB‑2',
      type: 'Employment‑Based Green Card (Second Preference)',
      img: '/services/eb2.jpg',
      alt: 'EB‑2 green card stock image',
    },
    {
      key: 'eb3',
      name: 'EB‑3',
      type: 'Employment‑Based Green Card (Third Preference)',
      img: '/services/eb3.jpg',
      alt: 'EB‑3 green card stock image',
    },
    {
      key: 'o1',
      name: 'O‑1',
      type: 'Extraordinary Ability Work Visa (Nonimmigrant)',
      img: '/services/o1.jpg',
      alt: 'O‑1 visa stock image',
    },
    {
      key: 'tn',
      name: 'TN',
      type: 'USMCA Professional Work Visa (Nonimmigrant)',
      img: '/services/tn.jpg',
      alt: 'TN visa stock image',
    },
  ]

  const sectionStyle: React.CSSProperties = {
    background: '#f0f0f0',
  }
  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '60px 16px',
  }
  const titleStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: 700,
    color: '#000',
  }
  const subtitleStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: 8,
    color: '#525252',
    fontSize: 16,
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
    marginTop: 28,
  }
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    minHeight: 260,
    display: 'flex',
    alignItems: 'flex-end',
    border: 'none',
  }
  const cardBodyStyle: React.CSSProperties = {
    padding: 16,
    display: 'grid',
    gap: 6,
    width: '100%',
  }
  const nameStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
  }
  const typeStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#ffffff',
  }

  return (
    <motion.section
      id="services"
      style={sectionStyle}
      variants={section}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div style={containerStyle}>
        <motion.h2 variants={headerPiece} style={titleStyle}>
          Services
        </motion.h2>
        <motion.p variants={headerPiece} style={subtitleStyle}>
          Six immigration programs we support today
        </motion.p>
        <motion.div variants={grid} style={gridStyle}>
          {services.map(s => (
            <motion.div
              variants={card}
              key={s.key}
              style={{
                ...cardStyle,
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url('${s.img}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-label={s.alt}
              role="img"
            >
              <motion.div variants={cardInner} style={cardBodyStyle}>
                <motion.div variants={piece} style={nameStyle}>
                  {s.name}
                </motion.div>
                <motion.div variants={piece} style={typeStyle}>
                  {s.type}
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* LEFT COLUMN: Brand + Support */}
        <div className={styles.leftCol}>
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <Image
                src="/logo-white.png"
                alt="logo"
                width={160}
                height={40}
                className={styles.logoImg}
                style={{ width: 'auto', height: '40px' }}
                priority
              />
            </div>

            <p className={styles.blurb}>
              Streamlining immigration document preparation with AI‑powered assistance for HR
              professionals and mobility experts worldwide.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Link
                href="https://www.linkedin.com/company/crossinglegal"
                aria-label="LinkedIn"
                style={{ color: '#fff' }}
              >
                <Linkedin size={22} />
              </Link>
              <Link
                href="https://x.com/skiplegal"
                aria-label="X (Twitter)"
                style={{ color: '#fff' }}
              >
                <Twitter size={22} />
              </Link>
              <Link
                href="https://www.facebook.com/crossinglegal"
                aria-label="Facebook"
                style={{ color: '#fff' }}
              >
                <Facebook size={22} />
              </Link>
              <Link
                href="https://www.instagram.com/crossinglegal"
                aria-label="Instagram"
                style={{ color: '#fff' }}
              >
                <Instagram size={22} />
              </Link>
              <Link
                href="mailto:support@crossinglegal.ai"
                aria-label="Email"
                style={{ color: '#fff' }}
              >
                <Mail size={22} />
              </Link>
              <Link href="tel:+18444754753" aria-label="Phone" style={{ color: '#fff' }}>
                <Phone size={22} />
              </Link>
            </div>
          </div>

          <FooterCol
            title="Support"
            items={[
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms of Use', href: '/terms-of-use' },
              { label: 'Contact Us', href: 'mailto:support@crossinglegal.ai' },
            ]}
          />
        </div>
      </div>

      <div className={styles.copyRow}>
        © {new Date().getFullYear()} Crossing Legal AI. All rights reserved.
      </div>
    </footer>
  )
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div className={styles.col}>
      <h4 className={styles.colTitle}>{title}</h4>
      <ul className={styles.colList}>
        {items.map(i => (
          <li key={i.label}>
            <Link className={styles.colLink} href={i.href}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
