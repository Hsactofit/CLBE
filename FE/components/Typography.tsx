import { Typography } from 'antd'
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react'

interface HeadingProps {
  children: React.ReactNode
  className?: string
}

export const Title = ({ children, className }: HeadingProps) => {
  return <div className={`text-4xl font-bold text-gray-900 ${className}`}>{children}</div>
}
export const SubTitle = ({ children, className }: HeadingProps) => {
  return <div className={`text-xl text-gray-600 ${className}`}>{children}</div>
}
export const Heading = Typography.Title
export const Paragraph = Typography.Paragraph
export const Text = Typography.Text
