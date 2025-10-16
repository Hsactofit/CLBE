import colors from '@/lib/colors'
import { ConfigProvider, Form } from 'antd'
import { Text } from './Typography'
import { LabeledValue, SelectProps, SelectValue } from 'antd/es/select'
import { Select } from 'antd'
import { ReactNode } from 'react'
import { RuleObject } from 'antd/es/form'

export type SelectProviderTypes = {
  colorBorder?: string
  children: React.ReactNode
  optionSelectedBg?: string
  showArrowPaddingInlineEnd?: number
}

export type SelectOption = {
  label: string | object | number
  value: string | object | number
  [key: string]: string | object | number | boolean
}

const SelectProvider = ({
  colorBorder,
  children,
  optionSelectedBg,
  showArrowPaddingInlineEnd,
}: SelectProviderTypes) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorBorder: colorBorder ? colorBorder : '#d9d9d9',
        },
        components: {
          Select: {
            optionSelectedBg: optionSelectedBg ? optionSelectedBg : colors.brand[0],
            showArrowPaddingInlineEnd: showArrowPaddingInlineEnd ? showArrowPaddingInlineEnd : 18,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export type SelectTypes = {
  size?: 'large' | 'middle' | 'small'
  defaultValue?: string | string[] | number | number[] | LabeledValue | LabeledValue[]
  dropdownStyles?: React.CSSProperties
  prefixIcon?: ReactNode
  prefixIconStyle?: React.CSSProperties
  options: SelectOption[] | Record<string, string | object | number | boolean>[]
  style?: React.CSSProperties
  loading?: boolean
  disabled?: boolean
  labelInValue?: boolean
  onSelect?: SelectProps<SelectValue>['onSelect']
  onChange?: SelectProps<SelectValue>['onSelect']
  value?: string | string[] | number | number[] | LabeledValue | LabeledValue[]
  label?: string
  name?: string
  className?: string
  placeholder?: string
  rules?: RuleObject[]
} & Pick<SelectProviderTypes, 'colorBorder' | 'optionSelectedBg' | 'showArrowPaddingInlineEnd'>

export const AntSelectField = ({
  colorBorder,
  size,
  options,
  style,
  labelInValue,
  optionSelectedBg,
  loading,
  dropdownStyles,
  onSelect,
  disabled,
  prefixIcon,
  showArrowPaddingInlineEnd,
  prefixIconStyle,
  label,
  name,
  className,
  rules,
  placeholder,
}: SelectTypes) => {
  return (
    <SelectProvider
      colorBorder={colorBorder}
      optionSelectedBg={optionSelectedBg}
      showArrowPaddingInlineEnd={showArrowPaddingInlineEnd}
    >
      {label && <Text className="mb-2 font-bold">{label}</Text>}
      <div style={{ position: 'relative' }}>
        {prefixIcon && <div style={prefixIconStyle}>{prefixIcon}</div>}
        <Form.Item name={name} rules={rules || []}>
          <Select
            placeholder={placeholder}
            className={`w-full ${className}`}
            size={size ? size : 'middle'}
            options={[{ label: placeholder, value: '' }, ...options]}
            loading={loading ? loading : false}
            style={style ? style : {}}
            labelInValue={labelInValue ? labelInValue : true}
            dropdownStyle={dropdownStyles ? dropdownStyles : { borderRadius: 2 }}
            onSelect={onSelect}
            disabled={disabled ? disabled : false}
          />
        </Form.Item>
      </div>
    </SelectProvider>
  )
}
